import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Filter,
  Building,
  User,
  Loader2,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

// Redux & API
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { paymentService } from "../../api/paymentService";

// Components
import DataTable from "../../components/DataTable";
import CustomDropdown from "../../components/ui/CustomDropdown";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

const PendingPayments = () => {
  const dispatch = useDispatch();

  // Redux Data
  const { buildings } = useSelector((state) => state.building);
  const { workers } = useSelector((state) => state.worker);

  // State
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  const [filterMode, setFilterMode] = useState("month");
  const today = new Date();

  const [filters, setFilters] = useState({
    serviceType: "residence",
    building: "all",
    worker: "all",
    status: "pending",
    startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
    endDate: new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).toISOString(),
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  useEffect(() => {
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line
  }, [filters, filterMode]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line
  }, [searchTerm]);

  const getDateRangeParams = () => {
    let start, end;
    if (filterMode === "date_range") {
      start = filters.startDate;
      end = filters.endDate;
    } else {
      start = new Date(filters.year, filters.month - 1, 1).toISOString();
      const lastDay = new Date(filters.year, filters.month, 0);
      lastDay.setHours(23, 59, 59, 999);
      end = lastDay.toISOString();
    }
    return { startDate: start, endDate: end };
  };

  const fetchData = async (page = 1, limit = 100) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeParams();
      const query = {
        ...filters,
        startDate,
        endDate,
        search: searchTerm,
        onewash: filters.serviceType === "onewash",
        worker: filters.worker === "all" ? "" : filters.worker,
        building: filters.building === "all" ? "" : filters.building,
        status: "pending",
      };

      const response = await paymentService.list(
        page,
        limit,
        searchTerm,
        query,
      );

      setData(response.data || []);
      setTotalRecords(response.total || 0);
      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    if (field === "building") {
      setFilters((prev) => ({ ...prev, building: value, worker: "all" }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleDateRangeChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // --- CRITICAL FIX: FETCH EXACT SAME DATA AS TABLE ---
  const fetchAndGroupExportData = async () => {
    const { startDate, endDate } = getDateRangeParams();

    // 1. Use the EXACT same query as the table
    const query = {
      ...filters,
      startDate,
      endDate,
      search: searchTerm,
      onewash: filters.serviceType === "onewash",
      worker: filters.worker === "all" ? "" : filters.worker,
      building: filters.building === "all" ? "" : filters.building,
      status: "pending",
    };

    // 2. Fetch using 'list' endpoint with a high limit to get ALL records
    const response = await paymentService.list(1, 10000, searchTerm, query);

    if (!response || !response.data || response.data.length === 0) return [];

    // 3. Filter for Pending Only (Client-side safety check)
    // Using total_amount and amount_paid from the list API response
    const pendingItems = response.data.filter(
      (item) => Number(item.total_amount) - Number(item.amount_paid) > 0,
    );

    // 4. Manual Grouping: Building -> Worker -> Payments
    const groupedData = [];

    console.log("🔍 [Export Debug] Total pending items:", pendingItems.length);
    console.log(
      "🔍 [Export Debug] Sample payment item (full object):",
      JSON.stringify(pendingItems[0], null, 2),
    );
    console.log(
      "🔍 [Export Debug] Sample building field:",
      pendingItems[0]?.building,
    );
    console.log(
      "🔍 [Export Debug] Sample customer.building field:",
      pendingItems[0]?.customer?.building,
    );

    pendingItems.forEach((item, index) => {
      // Try multiple ways to get building name
      const bName =
        item.building?.name ||
        item.customer?.building?.name ||
        "Unknown Building";
      const wName = item.worker?.name || "Unassigned";

      // Log first 3 items to check data structure
      if (index < 3) {
        console.log(`🏢 Item ${index + 1}:`, {
          buildingDirect: item.building,
          buildingNested: item.customer?.building,
          workerObj: item.worker,
          finalBuildingName: bName,
          finalWorkerName: wName,
          parking: item.vehicle?.parking_no,
        });
      }

      // Find or Create Building Group
      let bGroup = groupedData.find((g) => g.buildingName === bName);
      if (!bGroup) {
        bGroup = { buildingName: bName, workers: [] };
        groupedData.push(bGroup);
      }

      // Find or Create Worker Group
      let wGroup = bGroup.workers.find((w) => w.workerName === wName);
      if (!wGroup) {
        wGroup = { workerName: wName, payments: [] };
        bGroup.workers.push(wGroup);
      }

      // Add Payment
      wGroup.payments.push({
        parkingNo: item.vehicle?.parking_no || "-",
        regNo: item.vehicle?.registration_no || "-",
        totalDue: item.total_amount || 0,
        paid: item.amount_paid || 0,
        dueDate: new Date(item.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        customerMobile: item.customer?.mobile || "-",
      });
    });

    return groupedData;
  };

  // --- EXCEL DOWNLOAD (.xlsx) ---
  const handleDownloadExcel = async () => {
    setExcelLoading(true);
    const toastId = toast.loading("Generating Excel File...");

    try {
      const groupedData = await fetchAndGroupExportData();

      if (groupedData.length === 0) {
        toast.error("No pending payments found", { id: toastId });
        setExcelLoading(false);
        return;
      }

      // Create Workbook
      const workbook = new ExcelJS.Workbook();

      // Create a separate sheet for EACH building
      groupedData.forEach((buildingGroup) => {
        const buildingName = buildingGroup.buildingName || "Unknown";
        // Sanitize sheet name (max 31 chars, no special chars)
        const sheetName = buildingName
          .substring(0, 31)
          .replace(/[:\\\/?*\[\]]/g, "_");

        const sheet = workbook.addWorksheet(sheetName);

        // Define Columns
        sheet.columns = [
          { header: "Sl No", key: "slNo", width: 8 },
          { header: "Worker", key: "worker", width: 20 },
          { header: "Parking No", key: "parking", width: 15 },
          { header: "Reg No", key: "regNo", width: 15 },
          { header: "Amount Pending", key: "amount", width: 18 },
          { header: "Due Date", key: "date", width: 15 },
          { header: "Customer Mobile", key: "mobile", width: 18 },
        ];

        // Style Header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E78" },
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };

        // Add Data for this building
        let buildingIndex = 1;
        buildingGroup.workers.forEach((wg) => {
          wg.payments.forEach((p) => {
            const amountPending = Number(p.totalDue) - Number(p.paid);
            const row = sheet.addRow({
              slNo: buildingIndex++,
              worker: wg.workerName,
              parking: p.parkingNo,
              regNo: p.regNo,
              amount: amountPending,
              date: p.dueDate,
              mobile: p.customerMobile,
            });

            row.getCell("amount").numFmt = "#,##0.00";
            row.alignment = { vertical: "middle", horizontal: "center" };
            row.getCell("worker").alignment = { horizontal: "left" };
          });
        });
      });

      // Write & Save
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Pending_Payments_${filters.year}_${filters.month + 1}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `Excel File Downloaded! (${groupedData.length} building(s))`,
        { id: toastId },
      );
    } catch (error) {
      console.error(error);
      toast.error("Excel generation failed", { id: toastId });
    } finally {
      setExcelLoading(false);
    }
  };

  // --- PDF DOWNLOAD (A5) ---
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const toastId = toast.loading("Generating PDF Report...");

    try {
      const groupedData = await fetchAndGroupExportData();

      if (groupedData.length === 0) {
        toast.error("No pending payments found", { id: toastId });
        setPdfLoading(false);
        return;
      }

      // Initialize A5 PDF
      const doc = new jsPDF("p", "mm", "a5");
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;
      const margin = 10;

      try {
        const logoImg = await loadImage("/carwash.jpeg");
        const logoSize = 18;
        doc.addImage(
          logoImg,
          "JPEG",
          centerX - logoSize / 2,
          6,
          logoSize,
          logoSize,
        );
      } catch (e) {
        console.warn("Logo failed", e);
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("BABA CAR WASHING AND CLEANING LLC", centerX, 30, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38);
      doc.text("PENDING PAYMENTS / DUE LIST", centerX, 35, { align: "center" });
      doc.setTextColor(0);

      // Show Filter Info in Header
      let subTitle =
        filters.building !== "all"
          ? `Building: ${buildings.find((b) => b._id === filters.building)?.name || "Selected"}`
          : "All Buildings";

      doc.setFontSize(7);
      doc.text(subTitle, centerX, 39, { align: "center" });

      let dateText =
        filterMode === "month"
          ? `Period: ${new Date(filters.year, filters.month - 1).toLocaleString("default", { month: "long" })} ${filters.year}`
          : `${new Date(getDateRangeParams().startDate).toLocaleDateString()} - ${new Date(getDateRangeParams().endDate).toLocaleDateString()}`;

      doc.text(dateText, centerX, 43, { align: "center" });

      let currentY = 48;

      groupedData.forEach((buildingGroup, bIndex) => {
        if (bIndex > 0 || currentY > 185) {
          doc.addPage();
          currentY = 15;
        }

        buildingGroup.workers.forEach((workerGroup) => {
          if (currentY > 175) {
            doc.addPage();
            currentY = 15;
          }

          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, currentY - 4, pageWidth - margin * 2, 6, "F");
          doc.text(
            `${workerGroup.workerName}  |  ${buildingGroup.buildingName}`,
            margin + 2,
            currentY,
          );

          currentY += 3;

          const tableHead = [
            ["Sl", "Parking", "Reg No", "Building", "Amount", "Due Date"],
          ];
          const tableBody = workerGroup.payments.map((p, i) => {
            const amount = (Number(p.totalDue) - Number(p.paid)).toFixed(2);
            return [
              i + 1,
              p.parkingNo,
              p.regNo,
              buildingGroup.buildingName,
              amount,
              p.dueDate,
            ];
          });

          autoTable(doc, {
            startY: currentY,
            head: tableHead,
            body: tableBody,
            theme: "grid",
            headStyles: {
              fillColor: [50, 50, 50],
              textColor: 255,
              fontSize: 7,
              halign: "center",
              cellPadding: 1.5,
            },
            bodyStyles: {
              fontSize: 7,
              cellPadding: 1.5,
              halign: "center",
              textColor: 0,
            },
            columnStyles: {
              0: { cellWidth: 8 },
              1: { cellWidth: 22 },
              2: { cellWidth: 25 },
              3: { cellWidth: "auto" },
              4: { cellWidth: 20, fontStyle: "bold", halign: "right" },
              5: { cellWidth: 20 },
            },
            margin: { left: margin, right: margin },
          });

          currentY = doc.lastAutoTable.finalY + 8;
        });
      });

      doc.save(`Pending_List_A5_${filters.year}.pdf`);
      toast.success("A5 PDF Downloaded", { id: toastId, duration: 3000 });
    } catch (error) {
      console.error(error);
      toast.error("PDF generation failed", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const yearOptions = [2024, 2025, 2026, 2027].map((y) => ({
    value: y,
    label: String(y),
  }));

  const buildingOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Buildings" }];
    if (buildings)
      buildings.forEach((b) => opts.push({ value: b._id, label: b.name }));
    return opts;
  }, [buildings]);

  const workerOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Workers" }];
    if (!workers) return opts;

    let filteredList = workers;

    if (filters.building && filters.building !== "all") {
      filteredList = workers.filter((w) => {
        if (Array.isArray(w.buildings)) {
          return (
            w.buildings.includes(filters.building) ||
            w.buildings.some(
              (b) => b._id === filters.building || b === filters.building,
            )
          );
        }
        return false;
      });
    }

    filteredList.forEach((w) => opts.push({ value: w._id, label: w.name }));
    return opts;
  }, [workers, filters.building]);

  const columns = [
    {
      header: "PARKING",
      accessor: "vehicle.parking_no",
      className: "text-xs font-bold text-slate-600",
      render: (r) => r.vehicle?.parking_no || "-",
    },
    {
      header: "REG NO",
      accessor: "vehicle.registration_no",
      className: "text-xs font-mono font-bold text-slate-700",
      render: (r) => r.vehicle?.registration_no || "-",
    },
    {
      header: "BUILDING",
      accessor: "building.name",
      className: "text-xs font-medium text-slate-600",
      render: (r) => r.building?.name || r.customer?.building?.name || "-",
    },
    {
      header: "AMOUNT",
      accessor: "balance",
      className: "text-right text-xs font-bold text-red-600",
      render: (r) => (r.total_amount - r.amount_paid).toFixed(2),
    },
    {
      header: "DUE DATE",
      accessor: "createdAt",
      className: "text-right text-xs text-slate-500",
      render: (r) => {
        const d = new Date(r.createdAt);
        const dueDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return dueDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <Filter className="w-4 h-4" /> Filter Pending Payments
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode("date_range")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === "date_range" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Date Range Wise
            </button>
            <button
              onClick={() => setFilterMode("month")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Month Wise
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2">
            {filterMode === "date_range" ? (
              <div className="w-full">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                  Select Dates
                </label>
                <RichDateRangePicker
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onChange={handleDateRangeChange}
                />
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1">
                  <CustomDropdown
                    label="Select Month"
                    value={filters.month}
                    onChange={(v) => handleFilterChange("month", Number(v))}
                    options={monthOptions}
                    icon={Calendar}
                  />
                </div>
                <div className="w-32">
                  <CustomDropdown
                    label="Select Year"
                    value={filters.year}
                    onChange={(v) => handleFilterChange("year", Number(v))}
                    options={yearOptions}
                    icon={Calendar}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-1">
            <CustomDropdown
              label="Building"
              value={filters.building}
              onChange={(v) => handleFilterChange("building", v)}
              options={buildingOptions}
              icon={Building}
              searchable
            />
          </div>
          <div className="xl:col-span-1">
            <CustomDropdown
              label="Worker"
              value={filters.worker}
              onChange={(v) => handleFilterChange("worker", v)}
              options={workerOptions}
              icon={User}
              searchable
            />
          </div>

          <div className="xl:col-span-2 flex gap-2">
            <button
              onClick={handleDownloadExcel}
              disabled={excelLoading}
              className="flex-1 h-[42px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
            >
              {excelLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}{" "}
              Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex-1 h-[42px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}{" "}
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          onSearch={(term) => setSearchTerm(term)}
        />
      </div>
    </div>
  );
};

export default PendingPayments;
