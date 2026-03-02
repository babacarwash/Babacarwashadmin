import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  Building,
  Layers,
  Car,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import PricingModal from "../../components/modals/PricingModal";

// API
import { pricingService } from "../../api/pricingService";

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await pricingService.list(page, limit);

      setData(res.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10);
  }, []);

  const handleCreate = () => {
    setSelectedPricing(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedPricing(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this pricing?")) return;
    try {
      await pricingService.delete(row._id);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit);
    } catch {
      toast.error("Delete failed");
    }
  };

  // Helper for individual price badges
  const PriceItem = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-center justify-between text-xs py-1 border-b last:border-0 border-dashed border-slate-200">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-700 bg-white px-1.5 rounded shadow-sm border border-slate-100">
          {value}
        </span>
      </div>
    );
  };

  const columns = [
    {
      header: "Service Details",
      accessor: "service_type",
      className: "w-64 align-top py-4",
      render: (row) => (
        <div className="flex flex-col gap-3">
          {/* Service Type Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                row.service_type === "mall"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Type
              </p>
              <p className="text-sm font-bold text-slate-700 capitalize">
                {row.service_type}
              </p>
            </div>
          </div>

          {/* Premise Badge */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Premise
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {row.service_type === "mall"
                  ? row.mall?.name || "N/A"
                  : "Residential"}
              </p>
            </div>
          </div>
        </div>
      ),
    },

    {
      header: "Pricing Structure",
      accessor: "pricing",
      className: "align-top py-4",
      render: (row) => {
        // Unified pricing - read flat structure with fallback to legacy sedan/4x4
        const sedan = row.sedan || {};
        const suv = row["4x4"] || {};
        const isMall = row.service_type === "mall";

        // Resolve wash_types: flat first, then sedan, then 4x4
        const washTypes =
          row.wash_types || sedan.wash_types || suv.wash_types || {};
        const hasWashTypes = washTypes.inside || washTypes.outside;

        // Resolve frequency prices: flat first, then sedan, then 4x4
        const onetime = row.onetime || sedan.onetime || suv.onetime;
        const once = row.once || sedan.once || suv.once;
        const twice = row.twice || sedan.twice || suv.twice;
        const thrice = row.thrice || sedan.thrice || suv.thrice;
        const daily = row.daily || sedan.daily || suv.daily;

        return (
          <div>
            {/* SINGLE PRICING CARD */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-w-md">
              <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  Pricing
                </span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {isMall ? (
                  // Mall: Show wash types OR onetime
                  hasWashTypes ? (
                    <>
                      <PriceItem label="Inside" value={washTypes.inside} />
                      <PriceItem label="Outside" value={washTypes.outside} />
                      <PriceItem label="Total" value={washTypes.total} />
                    </>
                  ) : onetime ? (
                    <PriceItem label="Onetime" value={onetime} />
                  ) : (
                    <div className="col-span-2 text-xs text-slate-400 text-center py-2">
                      No pricing configured
                    </div>
                  )
                ) : (
                  // Residence/Mobile: Show regular pricing
                  <>
                    <PriceItem label="Onetime" value={onetime} />
                    {row.service_type === "residence" && (
                      <>
                        <PriceItem label="Once/Wk" value={once} />
                        <PriceItem label="Twice/Wk" value={twice} />
                        <PriceItem label="Thrice/Wk" value={thrice} />
                        <PriceItem label="Daily" value={daily} />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },

    {
      header: "Actions",
      className: "text-right w-24 align-top py-4",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all shadow-sm"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all shadow-sm"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* HEADER SECTION */}
      {/* <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"> */}
      {/* <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
              Service Pricing
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Manage wash rates for different vehicle types
            </p>
          </div>
        </div>
      </div> */}
      <button
        onClick={handleCreate}
        className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-xl transition-all active:scale-95"
      >
        <Plus className="w-5 h-5" />
        <span>Add New Price</span>
      </button>
      {/* </div> */}

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          hideSearch={true}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      {/* MODAL */}
      <PricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pricing={selectedPricing}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default Pricing;
