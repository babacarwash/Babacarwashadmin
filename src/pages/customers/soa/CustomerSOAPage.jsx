import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { customerService } from "../../../api/customerService";
import CustomDropdown from "../../../components/ui/CustomDropdown";
import SOATemplateCard from "./SOATemplateCard";
import SOAPrintSlip from "./SOAPrintSlip";
import "./soa-print.css";

const moneyFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (value) =>
  `AED ${moneyFormatter.format(Number(value || 0))}`;

const BRAND = {
  reportTitle: "Statement Of Account",
  logoPath: "/carwash.jpeg",
};

const HIDDEN_EXPORT_VALUES = new Set([
  "",
  "-",
  "N/A",
  "NA",
  "UNKNOWN",
  "UNKNOWN CUSTOMER",
  "UNNAMED CUSTOMER",
  "NULL",
  "UNDEFINED",
]);

const sanitizeFilePart = (value) => {
  return String(value || "SOA")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
};

const normalizeTextValue = (value) => String(value ?? "").trim();

const hasDisplayValue = (value) => {
  const normalized = normalizeTextValue(value);
  if (!normalized) return false;
  return !HIDDEN_EXPORT_VALUES.has(normalized.toUpperCase());
};

const cleanTextValue = (value) =>
  hasDisplayValue(value) ? normalizeTextValue(value) : "";

const buildVehicleLabel = (registrationNo, parkingNo) => {
  const values = [
    cleanTextValue(registrationNo),
    cleanTextValue(parkingNo),
  ].filter(Boolean);
  return values.join(" / ");
};

const pushIfPresent = (rows, label, value) => {
  if (hasDisplayValue(value)) {
    rows.push([label, normalizeTextValue(value)]);
  }
};

const getAgingBucketRows = (summary = {}) => {
  const source = summary.agingBuckets || {};

  return [
    {
      label: "0-30 Days",
      amount: Number(source.bucket_0_30?.amount || 0),
      months: Number(source.bucket_0_30?.months || 0),
    },
    {
      label: "31-60 Days",
      amount: Number(source.bucket_31_60?.amount || 0),
      months: Number(source.bucket_31_60?.months || 0),
    },
    {
      label: "61-90 Days",
      amount: Number(source.bucket_61_90?.amount || 0),
      months: Number(source.bucket_61_90?.months || 0),
    },
    {
      label: "90+ Days",
      amount: Number(source.bucket_90_plus?.amount || 0),
      months: Number(source.bucket_90_plus?.months || 0),
    },
  ];
};

const resolveFileBaseName = ({ customer, scope }) => {
  const preferredCustomerName = hasDisplayValue(customer?.fullName)
    ? customer.fullName
    : hasDisplayValue(customer?.customerCode)
      ? `Customer_${customer.customerCode}`
      : "SOA";
  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${sanitizeFilePart(preferredCustomerName)}_SOA_${scope}_${dateTag}`;
};

const loadImageAsDataURL = (path) => {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = path;
  });
};

const getMonthLabel = (monthKey) => {
  if (!monthKey) return "All Months";
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date
    .toLocaleString("default", { month: "short", year: "numeric" })
    .toUpperCase();
};

const CustomerSOAPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const vehicleIdParam = searchParams.get("vehicleId") || "";
  const fromMonthParam = searchParams.get("fromMonth") || "";
  const toMonthParam = searchParams.get("toMonth") || "";

  const [soaData, setSoaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const loadSOA = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await customerService.getSOA(id, {
        vehicleId: vehicleIdParam,
        fromMonth: fromMonthParam,
        toMonth: toMonthParam,
      });

      const payload = response?.data || response;
      setSoaData(payload || null);
    } catch (error) {
      console.error("Failed to fetch SOA", error);
      toast.error("Failed to load SOA");
      setSoaData(null);
    } finally {
      setLoading(false);
    }
  }, [id, vehicleIdParam, fromMonthParam, toMonthParam]);

  useEffect(() => {
    loadSOA();
  }, [loadSOA]);

  const availableMonths = useMemo(
    () =>
      Array.isArray(soaData?.availableMonths) ? soaData.availableMonths : [],
    [soaData],
  );
  const vehicles = useMemo(
    () => (Array.isArray(soaData?.vehicles) ? soaData.vehicles : []),
    [soaData],
  );

  const selectedVehicleLabel = useMemo(() => {
    if (!soaData?.filters?.vehicleId) {
      return "All Vehicles";
    }

    const selected = vehicles.find(
      (vehicle) =>
        String(vehicle.vehicleId) === String(soaData.filters.vehicleId),
    );

    if (selected) {
      const selectedLabel = buildVehicleLabel(
        selected.registrationNo,
        selected.parkingNo,
      );
      if (selectedLabel) {
        return selectedLabel;
      }
    }

    if (soaData?.selectedVehicle) {
      const selectedFallbackLabel = buildVehicleLabel(
        soaData.selectedVehicle.registrationNo,
        soaData.selectedVehicle.parkingNo,
      );
      if (selectedFallbackLabel) {
        return selectedFallbackLabel;
      }
    }

    return "Selected Vehicle";
  }, [soaData, vehicles]);

  const monthRangeLabel = useMemo(() => {
    const fromLabel = getMonthLabel(soaData?.filters?.fromMonth);
    const toLabel = getMonthLabel(soaData?.filters?.toMonth);

    if (!soaData?.filters?.fromMonth && !soaData?.filters?.toMonth) {
      return "All Months";
    }

    return `${fromLabel} to ${toLabel}`;
  }, [soaData]);

  const applyInstantFilters = useCallback(
    (updates = {}) => {
      const nextFilters = {
        vehicleId: vehicleIdParam,
        fromMonth: fromMonthParam,
        toMonth: toMonthParam,
        ...updates,
      };

      if (
        nextFilters.fromMonth &&
        nextFilters.toMonth &&
        String(nextFilters.fromMonth) > String(nextFilters.toMonth)
      ) {
        if (Object.prototype.hasOwnProperty.call(updates, "fromMonth")) {
          nextFilters.toMonth = nextFilters.fromMonth;
        }

        if (Object.prototype.hasOwnProperty.call(updates, "toMonth")) {
          nextFilters.fromMonth = nextFilters.toMonth;
        }
      }

      const nextParams = new URLSearchParams();
      if (nextFilters.vehicleId) {
        nextParams.set("vehicleId", nextFilters.vehicleId);
      }
      if (nextFilters.fromMonth) {
        nextParams.set("fromMonth", nextFilters.fromMonth);
      }
      if (nextFilters.toMonth) {
        nextParams.set("toMonth", nextFilters.toMonth);
      }

      setSearchParams(nextParams);
    },
    [vehicleIdParam, fromMonthParam, toMonthParam, setSearchParams],
  );

  const vehicleOptions = useMemo(
    () => [
      { value: "", label: "All Vehicles" },
      ...vehicles.map((vehicle, index) => ({
        value: String(vehicle.vehicleId || ""),
        label:
          buildVehicleLabel(vehicle.registrationNo, vehicle.parkingNo) ||
          `Vehicle ${index + 1}`,
      })),
    ],
    [vehicles],
  );

  const monthOptions = useMemo(
    () => [
      { value: "", label: "All" },
      ...availableMonths.map((monthOption) => ({
        value: String(monthOption.value || ""),
        label: monthOption.label,
      })),
    ],
    [availableMonths],
  );

  const handleDownloadExcel = () => {
    if (!soaData) {
      toast.error("No SOA data available");
      return;
    }

    setDownloadingExcel(true);
    try {
      const customer = soaData.customer || {};
      const summary = soaData.summary || {};
      const monthly = soaData.monthly || [];
      const transactions = soaData.transactions || [];
      const oneWashSummary = soaData.oneWash?.summary || {};
      const oneWashTransactions = soaData.oneWash?.transactions || [];
      const washActivityEntries = soaData.washActivity?.entries || [];

      const agingRows = getAgingBucketRows(summary);

      const summaryRows = [
        ["STATEMENT OF ACCOUNT (SOA)"],
        ["Generated On", new Date().toLocaleString("en-GB")],
      ];

      const metadataRows = [];
      pushIfPresent(metadataRows, "Customer Name", customer.fullName);
      pushIfPresent(metadataRows, "Customer Code", customer.customerCode);
      pushIfPresent(metadataRows, "Mobile", customer.mobile);
      pushIfPresent(metadataRows, "Building", customer.buildingName);
      pushIfPresent(metadataRows, "Flat", customer.flatNo);
      pushIfPresent(metadataRows, "Vehicle Scope", selectedVehicleLabel);
      pushIfPresent(metadataRows, "Month Range", monthRangeLabel);

      if (metadataRows.length > 0) {
        summaryRows.push([], ...metadataRows);
      }

      summaryRows.push(
        [],
        ["Total Opening", summary.totalOpeningBalance || 0],
        ["Total Subscription", summary.totalSubscription || 0],
        ["Total Billed", summary.totalBilled || 0],
        ["Total Paid", summary.totalPaid || 0],
        ["Total Due", summary.totalDue || 0],
        ["Collection %", Number(summary.collectionPercent || 0).toFixed(1)],
      );

      summaryRows.push(
        [],
        ["OneWash Base", oneWashSummary.totalBaseAmount || 0],
        ["OneWash Tips", oneWashSummary.totalTips || 0],
        ["OneWash Billed", oneWashSummary.totalBilled || 0],
        ["OneWash Paid", oneWashSummary.totalPaid || 0],
        ["OneWash Due", oneWashSummary.totalDue || 0],
        [
          "OneWash Collection %",
          Number(oneWashSummary.collectionPercent || 0).toFixed(1),
        ],
        ["Overall Billed", summary.overallBilled || summary.totalBilled || 0],
        ["Overall Paid", summary.overallPaid || summary.totalPaid || 0],
        ["Overall Due", summary.overallDue || summary.totalDue || 0],
      );

      summaryRows.push([], ["Aging Bucket", "Due Amount", "Months"]);
      agingRows.forEach((bucket) => {
        summaryRows.push([bucket.label, bucket.amount, bucket.months]);
      });

      summaryRows.push(
        [],
        ["Prepared By", "Accounts Team"],
        ["Approved By", "________________"],
        ["Signature", "________________"],
      );

      const monthlyRows = [
        [
          "Month",
          "Opening Balance",
          "Subscription",
          "Billed",
          "Paid",
          "Due",
          "Due Date",
          "Status",
          "Collection %",
        ],
        ...monthly.map((row) => [
          cleanTextValue(row.monthLabel),
          Number(row.openingBalance || 0),
          Number(row.subscriptionAmount || 0),
          Number(row.billedAmount || 0),
          Number(row.paidAmount || 0),
          Number(row.dueAmount || 0),
          cleanTextValue(row.dueDateDisplay),
          cleanTextValue(row.status),
          Number(row.collectionPercent || 0),
        ]),
      ];

      const transactionRows = [
        [
          "#",
          "Month",
          "Vehicle",
          "Parking",
          "Opening",
          "Subscription",
          "Billed",
          "Paid",
          "Due",
          "Due Date",
          "Payment Date",
          "Mode",
          "Status",
          "Receipt",
          "Notes",
        ],
        ...transactions.map((row) => [
          row.serialNo,
          cleanTextValue(row.monthLabel),
          cleanTextValue(row.registrationNo),
          cleanTextValue(row.parkingNo),
          Number(row.openingBalance || 0),
          Number(row.subscriptionAmount || 0),
          Number(row.billedAmount || 0),
          Number(row.paidAmount || 0),
          Number(row.dueAmount || 0),
          cleanTextValue(row.dueDateDisplay),
          cleanTextValue(row.paymentDate),
          cleanTextValue(row.paymentMode),
          cleanTextValue(row.status),
          cleanTextValue(row.receiptNo),
          cleanTextValue(row.notes),
        ]),
      ];

      const vehicleRows = [
        [
          "Vehicle",
          "Parking",
          "Monthly Amount",
          "Advance",
          "Schedule Type",
          "Schedule Days",
          "Status",
        ],
        ...vehicles.map((vehicle) => [
          cleanTextValue(vehicle.registrationNo),
          cleanTextValue(vehicle.parkingNo),
          Number(vehicle.amount || 0),
          Number(vehicle.advanceAmount || 0),
          cleanTextValue(vehicle.scheduleType),
          cleanTextValue(vehicle.scheduleDays),
          cleanTextValue(vehicle.status),
        ]),
      ];

      const oneWashRows = [
        [
          "#",
          "Month",
          "Vehicle",
          "Parking",
          "Base",
          "Tip",
          "Billed",
          "Paid",
          "Due",
          "Mode",
          "Status",
          "Payment Date",
          "Receipt",
        ],
        ...oneWashTransactions.map((row) => [
          row.serialNo,
          cleanTextValue(row.monthLabel),
          cleanTextValue(row.registrationNo),
          cleanTextValue(row.parkingNo),
          Number(row.baseAmount || 0),
          Number(row.tipAmount || 0),
          Number(row.billedAmount || 0),
          Number(row.paidAmount || 0),
          Number(row.dueAmount || 0),
          cleanTextValue(row.paymentMode),
          cleanTextValue(row.status),
          cleanTextValue(row.paymentDate),
          cleanTextValue(row.receiptNo),
        ]),
      ];

      const washActivityRows = [
        [
          "#",
          "Date",
          "Month",
          "Type",
          "Vehicle",
          "Parking",
          "Status",
          "Worker",
          "Amount",
          "Tips",
          "Schedule ID",
          "Created Source",
          "Notes",
        ],
        ...washActivityEntries.map((row) => [
          row.serialNo,
          cleanTextValue(row.date),
          cleanTextValue(row.monthLabel),
          cleanTextValue(row.activityType),
          cleanTextValue(row.registrationNo),
          cleanTextValue(row.parkingNo),
          cleanTextValue(row.status),
          cleanTextValue(row.workerName),
          Number(row.amount || 0),
          Number(row.tipAmount || 0),
          cleanTextValue(row.scheduleId),
          cleanTextValue(row.createdSource),
          cleanTextValue(row.notes),
        ]),
      ];

      const workbook = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 24 }, { wch: 40 }];

      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyRows);
      monthlySheet["!cols"] = [
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
      ];

      const transactionSheet = XLSX.utils.aoa_to_sheet(transactionRows);
      transactionSheet["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 35 },
      ];

      const vehiclesSheet = XLSX.utils.aoa_to_sheet(vehicleRows);
      vehiclesSheet["!cols"] = [
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 28 },
        { wch: 10 },
      ];

      const oneWashSheet = XLSX.utils.aoa_to_sheet(oneWashRows);
      oneWashSheet["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
      ];

      const washActivitySheet = XLSX.utils.aoa_to_sheet(washActivityRows);
      washActivitySheet["!cols"] = [
        { wch: 5 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 16 },
        { wch: 30 },
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "SOA Summary");
      XLSX.utils.book_append_sheet(workbook, monthlySheet, "Month Wise");
      XLSX.utils.book_append_sheet(workbook, transactionSheet, "Transactions");
      XLSX.utils.book_append_sheet(workbook, vehiclesSheet, "Vehicle Master");
      XLSX.utils.book_append_sheet(workbook, oneWashSheet, "OneWash");
      XLSX.utils.book_append_sheet(workbook, washActivitySheet, "Wash Activity");

      const fileBase = resolveFileBaseName({
        customer,
        scope: vehicleIdParam ? "Vehicle" : "AllVehicles",
      });
      XLSX.writeFile(workbook, `${fileBase}.xlsx`);

      toast.success("SOA Excel downloaded");
    } catch (error) {
      console.error("Excel SOA download failed", error);
      toast.error("Failed to download SOA Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!soaData) {
      toast.error("No SOA data available");
      return;
    }

    setDownloadingPdf(true);

    try {
      const customer = soaData.customer || {};
      const summary = soaData.summary || {};
      const monthly = soaData.monthly || [];
      const transactions = soaData.transactions || [];
      const oneWashSummary = soaData.oneWash?.summary || {};
      const oneWashTransactions = soaData.oneWash?.transactions || [];
      const washActivityEntries = soaData.washActivity?.entries || [];

      const agingRows = getAgingBucketRows(summary);
      const logoDataUrl = await loadImageAsDataURL(BRAND.logoPath);

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", 10, 7, 12, 12);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("STATEMENT OF ACCOUNT (SOA)", pageWidth / 2, 16, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const headerLines = [];
      if (hasDisplayValue(customer.fullName)) {
        headerLines.push(`Customer: ${normalizeTextValue(customer.fullName)}`);
      }
      if (hasDisplayValue(customer.customerCode)) {
        headerLines.push(`Code: ${normalizeTextValue(customer.customerCode)}`);
      }
      if (hasDisplayValue(customer.mobile)) {
        headerLines.push(`Mobile: ${normalizeTextValue(customer.mobile)}`);
      }
      if (hasDisplayValue(customer.buildingName)) {
        headerLines.push(
          `Building: ${normalizeTextValue(customer.buildingName)}`,
        );
      }
      headerLines.push(
        `Vehicle Scope: ${normalizeTextValue(selectedVehicleLabel)}`,
      );
      headerLines.push(`Month Range: ${normalizeTextValue(monthRangeLabel)}`);
      headerLines.push(`Generated: ${new Date().toLocaleDateString("en-GB")}`);

      const leftColumn = headerLines.filter((_, index) => index % 2 === 0);
      const rightColumn = headerLines.filter((_, index) => index % 2 === 1);

      leftColumn.forEach((line, index) => {
        doc.text(line, 10, 24 + index * 6);
      });

      rightColumn.forEach((line, index) => {
        doc.text(line, 145, 24 + index * 6);
      });

      autoTable(doc, {
        startY: 48,
        theme: "grid",
        head: [["Metric", "Value", "Metric", "Value"]],
        body: [
          [
            "Total Opening",
            formatAmount(summary.totalOpeningBalance),
            "Total Subscription",
            formatAmount(summary.totalSubscription),
          ],
          [
            "Total Billed",
            formatAmount(summary.totalBilled),
            "Total Paid",
            formatAmount(summary.totalPaid),
          ],
          [
            "Total Due",
            formatAmount(summary.totalDue),
            "Collection %",
            `${Number(summary.collectionPercent || 0).toFixed(1)}%`,
          ],
        ],
        headStyles: { fillColor: [30, 64, 175] },
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [["OneWash Metric", "Value", "OneWash Metric", "Value"]],
        body: [
          [
            "Base Amount",
            formatAmount(oneWashSummary.totalBaseAmount),
            "Tip Amount",
            formatAmount(oneWashSummary.totalTips),
          ],
          [
            "Billed",
            formatAmount(oneWashSummary.totalBilled),
            "Paid",
            formatAmount(oneWashSummary.totalPaid),
          ],
          [
            "Due",
            formatAmount(oneWashSummary.totalDue),
            "Collection %",
            `${Number(oneWashSummary.collectionPercent || 0).toFixed(1)}%`,
          ],
        ],
        headStyles: { fillColor: [185, 28, 28] },
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [["Aging Bucket", "Due Amount", "Months"]],
        body: agingRows.map((bucket) => [
          bucket.label,
          formatAmount(bucket.amount),
          String(bucket.months || 0),
        ]),
        headStyles: { fillColor: [124, 58, 237] },
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [
          [
            "Month",
            "Opening",
            "Subscription",
            "Billed",
            "Paid",
            "Due",
            "Due Date",
            "Status",
          ],
        ],
        body:
          monthly.length > 0
            ? monthly.map((row) => [
                cleanTextValue(row.monthLabel),
                formatAmount(row.openingBalance),
                formatAmount(row.subscriptionAmount),
                formatAmount(row.billedAmount),
                formatAmount(row.paidAmount),
                formatAmount(row.dueAmount),
                cleanTextValue(row.dueDateDisplay),
                cleanTextValue(row.status),
              ])
            : [["No records", "-", "-", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [15, 118, 110] },
        styles: { fontSize: 7.5 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [
          [
            "#",
            "Month",
            "Vehicle",
            "Billed",
            "Paid",
            "Due",
            "Due Date",
            "Mode",
            "Status",
          ],
        ],
        body:
          transactions.length > 0
            ? transactions
                .slice(0, 35)
                .map((row) => [
                  row.serialNo,
                  cleanTextValue(row.monthLabel),
                  buildVehicleLabel(row.registrationNo, row.parkingNo),
                  formatAmount(row.billedAmount),
                  formatAmount(row.paidAmount),
                  formatAmount(row.dueAmount),
                  cleanTextValue(row.dueDateDisplay),
                  cleanTextValue(row.paymentMode),
                  cleanTextValue(row.status),
                ])
            : [["-", "No transactions", "-", "-", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [55, 65, 81] },
        styles: { fontSize: 7 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [
          [
            "#",
            "Month",
            "Vehicle",
            "Base",
            "Tip",
            "Billed",
            "Paid",
            "Due",
            "Mode",
          ],
        ],
        body:
          oneWashTransactions.length > 0
            ? oneWashTransactions.slice(0, 30).map((row) => [
                row.serialNo,
                cleanTextValue(row.monthLabel),
                buildVehicleLabel(row.registrationNo, row.parkingNo),
                formatAmount(row.baseAmount),
                formatAmount(row.tipAmount),
                formatAmount(row.billedAmount),
                formatAmount(row.paidAmount),
                formatAmount(row.dueAmount),
                cleanTextValue(row.paymentMode),
              ])
            : [["-", "No onewash records", "-", "-", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [127, 29, 29] },
        styles: { fontSize: 7 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [
          [
            "#",
            "Date",
            "Type",
            "Vehicle",
            "Status",
            "Worker",
            "Amount",
            "Tips",
          ],
        ],
        body:
          washActivityEntries.length > 0
            ? washActivityEntries.slice(0, 30).map((row) => [
                row.serialNo,
                cleanTextValue(row.date),
                cleanTextValue(row.activityType),
                buildVehicleLabel(row.registrationNo, row.parkingNo),
                cleanTextValue(row.status),
                cleanTextValue(row.workerName),
                formatAmount(row.amount),
                formatAmount(row.tipAmount),
              ])
            : [["-", "No wash activity", "-", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 7 },
      });

      let signatureY = (doc.lastAutoTable?.finalY || 48) + 10;
      if (signatureY > pageHeight - 16) {
        doc.addPage();
        signatureY = 20;
      }

      doc.setDrawColor(148, 163, 184);
      doc.line(10, signatureY, pageWidth - 10, signatureY);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Prepared By: ____________________", 10, signatureY + 6);
      doc.text("Approved By: ____________________", 92, signatureY + 6);
      doc.text("System Generated", pageWidth - 10, signatureY + 6, {
        align: "right",
      });

      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `${BRAND.reportTitle} | Page ${page} of ${totalPages}`,
          pageWidth - 10,
          pageHeight - 4,
          { align: "right" },
        );
      }

      const fileBase = resolveFileBaseName({
        customer,
        scope: vehicleIdParam ? "Vehicle" : "AllVehicles",
      });
      doc.save(`${fileBase}.pdf`);

      toast.success("SOA PDF downloaded");
    } catch (error) {
      console.error("SOA PDF generation failed", error);
      toast.error("Failed to download SOA PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="soa-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="soa-print-wrap max-w-7xl mx-auto space-y-4">
        <div className="soa-no-print bg-white rounded-2xl border border-slate-200 shadow-lg p-4 md:p-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-bold">
                  Customer Accounts
                </p>
                <h1 className="text-lg md:text-xl font-extrabold text-slate-800">
                  Statement Of Account (SOA)
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf || loading || !soaData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                PDF
              </button>
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel || loading || !soaData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {downloadingExcel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
            <div className="xl:col-span-2">
              <CustomDropdown
                label="Vehicle"
                value={vehicleIdParam}
                onChange={(nextValue) =>
                  applyInstantFilters({ vehicleId: String(nextValue || "") })
                }
                options={vehicleOptions}
                placeholder="All Vehicles"
                icon={Car}
                searchable
              />
            </div>

            <div>
              <CustomDropdown
                label="From Month"
                value={fromMonthParam}
                onChange={(nextValue) =>
                  applyInstantFilters({ fromMonth: String(nextValue || "") })
                }
                options={monthOptions}
                placeholder="All"
                icon={CalendarDays}
              />
            </div>

            <div>
              <CustomDropdown
                label="To Month"
                value={toMonthParam}
                onChange={(nextValue) =>
                  applyInstantFilters({ toMonth: String(nextValue || "") })
                }
                options={monthOptions}
                placeholder="All"
                icon={CalendarDays}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 flex items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading SOA...
          </div>
        )}

        {!loading && soaData && (
          <>
            <SOATemplateCard soaData={soaData} />
            <SOAPrintSlip
              soaData={soaData}
              selectedVehicleLabel={selectedVehicleLabel}
              monthRangeLabel={monthRangeLabel}
            />
          </>
        )}

        {!loading && !soaData && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-10 text-center text-slate-500">
            No SOA data available for this customer.
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSOAPage;
