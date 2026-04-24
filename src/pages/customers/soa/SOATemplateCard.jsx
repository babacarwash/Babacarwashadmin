import React from "react";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  Clock3,
  Phone,
  User,
  Wallet,
} from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (value) =>
  `AED ${moneyFormatter.format(Number(value || 0))}`;

const buildVehicleLabel = (registrationNo, parkingNo) => {
  const reg = String(registrationNo || "").trim();
  const parking = String(parkingNo || "").trim();
  const joined = [reg, parking].filter(Boolean).join(" / ");
  return joined || "-";
};

const SOATemplateCard = ({ soaData }) => {
  const customer = soaData?.customer || {};
  const summary = soaData?.summary || {};
  const insights = soaData?.insights || {};
  const monthly = soaData?.monthly || [];
  const transactions = soaData?.transactions || [];
  const oneWashSummary = soaData?.oneWash?.summary || {};
  const oneWashTransactions = soaData?.oneWash?.transactions || [];
  const washActivityEntries = soaData?.washActivity?.entries || [];
  const washActivitySummary = soaData?.washActivity?.summary || {};
  const selectedVehicle = soaData?.selectedVehicle;
  const agingBuckets = [
    {
      label: "0-30 Days",
      amount: Number(summary?.agingBuckets?.bucket_0_30?.amount || 0),
      months: Number(summary?.agingBuckets?.bucket_0_30?.months || 0),
    },
    {
      label: "31-60 Days",
      amount: Number(summary?.agingBuckets?.bucket_31_60?.amount || 0),
      months: Number(summary?.agingBuckets?.bucket_31_60?.months || 0),
    },
    {
      label: "61-90 Days",
      amount: Number(summary?.agingBuckets?.bucket_61_90?.amount || 0),
      months: Number(summary?.agingBuckets?.bucket_61_90?.months || 0),
    },
    {
      label: "90+ Days",
      amount: Number(summary?.agingBuckets?.bucket_90_plus?.amount || 0),
      months: Number(summary?.agingBuckets?.bucket_90_plus?.months || 0),
    },
  ];

  return (
    <div
      id="soa-template-card"
      className="soa-print-card bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
    >
      <div className="soa-print-section bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-800 px-6 py-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center mb-2">
              <img
                src="/carwash.jpeg"
                alt="BCW"
                className="h-10 w-10 object-contain bg-white rounded-full p-1 shadow"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100 font-bold">
              Statement Of Account
            </p>
            <h2 className="text-2xl font-extrabold mt-1">SOA</h2>
            <p className="text-sm text-blue-100 mt-1">
              Monthly paid vs due summary for customer billing records.
            </p>
          </div>

          <div className="bg-white/15 border border-white/30 rounded-xl px-4 py-3 min-w-[260px]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100 font-bold">
              Scope
            </p>
            <p className="text-sm font-semibold mt-1">
              {selectedVehicle
                ? buildVehicleLabel(
                    selectedVehicle.registrationNo,
                    selectedVehicle.parkingNo,
                  )
                : "All Vehicles"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="soa-print-section grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Customer
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {customer.fullName || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: {customer.customerCode || "-"}
            </p>
          </div>

          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Mobile
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {customer.mobile || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Status: {customer.status || "-"}
            </p>
          </div>

          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Building
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {customer.buildingName || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Flat: {customer.flatNo || "-"}
            </p>
          </div>

          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Vehicles
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {soaData?.vehicles?.length || 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Payments: {summary.paymentsCount || 0}
            </p>
          </div>
        </div>

        <div className="soa-print-section grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="soa-compact-trim rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">
              Total Billed
            </p>
            <p className="text-xl font-extrabold text-blue-900 mt-1">
              {formatAmount(summary.totalBilled)}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wide">
              Total Paid
            </p>
            <p className="text-xl font-extrabold text-emerald-900 mt-1">
              {formatAmount(summary.totalPaid)}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
              Total Due
            </p>
            <p className="text-xl font-extrabold text-rose-900 mt-1">
              {formatAmount(summary.totalDue)}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
            <p className="text-xs text-violet-700 font-bold uppercase tracking-wide">
              Collection
            </p>
            <p className="text-xl font-extrabold text-violet-900 mt-1">
              {Number(summary.collectionPercent || 0).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="soa-print-section grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="soa-compact-trim rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
            <p className="text-xs text-sky-700 font-bold uppercase tracking-wide">
              OneWash Base
            </p>
            <p className="text-xl font-extrabold text-sky-900 mt-1">
              {formatAmount(oneWashSummary.totalBaseAmount)}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wide">
              OneWash Tips
            </p>
            <p className="text-xl font-extrabold text-amber-900 mt-1">
              {formatAmount(oneWashSummary.totalTips)}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wide">
              OneWash Paid
            </p>
            <p className="text-xl font-extrabold text-indigo-900 mt-1">
              {formatAmount(oneWashSummary.totalPaid)}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-xs text-orange-700 font-bold uppercase tracking-wide">
              OneWash Due
            </p>
            <p className="text-xl font-extrabold text-orange-900 mt-1">
              {formatAmount(oneWashSummary.totalDue)}
            </p>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" /> Aging Buckets
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-3">
            {agingBuckets.map((bucket) => (
              <div
                key={bucket.label}
                className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                  {bucket.label}
                </p>
                <p className="text-base font-extrabold text-slate-800 mt-1">
                  {formatAmount(bucket.amount)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Months: {bucket.months}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> Month Wise Statement
          </div>
          <div className="overflow-x-auto">
            <table className="soa-print-table w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Month</th>
                  <th className="text-right px-3 py-2 font-bold">Opening</th>
                  <th className="text-right px-3 py-2 font-bold">
                    Subscription
                  </th>
                  <th className="text-right px-3 py-2 font-bold">Billed</th>
                  <th className="text-right px-3 py-2 font-bold">Paid</th>
                  <th className="text-right px-3 py-2 font-bold">Due</th>
                  <th className="text-center px-3 py-2 font-bold">Due Date</th>
                  <th className="text-center px-3 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-5 text-center text-slate-400 italic"
                    >
                      No month-wise records found for selected filters.
                    </td>
                  </tr>
                )}
                {monthly.map((monthRow) => (
                  <tr
                    key={monthRow.month}
                    className="soa-compact-trim border-t border-slate-100"
                  >
                    <td className="px-3 py-2 font-semibold text-slate-700">
                      {monthRow.monthLabel}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatAmount(monthRow.openingBalance)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatAmount(monthRow.subscriptionAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">
                      {formatAmount(monthRow.billedAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                      {formatAmount(monthRow.paidAmount)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${
                        Number(monthRow.dueAmount || 0) > 0
                          ? "text-rose-600"
                          : "text-slate-600"
                      }`}
                    >
                      {formatAmount(monthRow.dueAmount)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {monthRow.dueDateDisplay || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          monthRow.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {monthRow.status === "PAID" ? (
                          <BadgeCheck className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {monthRow.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="soa-print-section grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500 font-bold uppercase tracking-wide">
              Months Covered
            </p>
            <p className="text-base font-extrabold text-slate-800 mt-1">
              {summary.monthsCovered || 0}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500 font-bold uppercase tracking-wide">
              Last Payment
            </p>
            <p className="text-base font-extrabold text-slate-800 mt-1">
              {summary.lastPaymentDate || "-"}
            </p>
          </div>
          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Due Months
            </p>
            <p className="text-base font-extrabold text-slate-800 mt-1">
              {insights.monthsWithDue || 0}
            </p>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            Latest Transactions
          </div>
          <div className="overflow-x-auto">
            <table className="soa-print-table w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">#</th>
                  <th className="text-left px-3 py-2 font-bold">Month</th>
                  <th className="text-left px-3 py-2 font-bold">Vehicle</th>
                  <th className="text-right px-3 py-2 font-bold">Billed</th>
                  <th className="text-right px-3 py-2 font-bold">Paid</th>
                  <th className="text-right px-3 py-2 font-bold">Due</th>
                  <th className="text-left px-3 py-2 font-bold">Due Date</th>
                  <th className="text-center px-3 py-2 font-bold">Mode</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-5 text-center text-slate-400 italic"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
                {transactions.slice(0, 10).map((entry) => (
                  <tr
                    key={entry.id || `${entry.serialNo}-${entry.billingMonth}`}
                    className="soa-compact-trim border-t border-slate-100"
                  >
                    <td className="px-3 py-2 text-slate-500">
                      {entry.serialNo}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-700">
                      {entry.monthLabel}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {buildVehicleLabel(entry.registrationNo, entry.parkingNo)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatAmount(entry.billedAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                      {formatAmount(entry.paidAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-600 font-semibold">
                      {formatAmount(entry.dueAmount)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {entry.dueDateDisplay || "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {entry.paymentMode || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            OneWash Transactions
          </div>
          <div className="overflow-x-auto">
            <table className="soa-print-table w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">#</th>
                  <th className="text-left px-3 py-2 font-bold">Month</th>
                  <th className="text-left px-3 py-2 font-bold">Vehicle</th>
                  <th className="text-right px-3 py-2 font-bold">Base</th>
                  <th className="text-right px-3 py-2 font-bold">Tips</th>
                  <th className="text-right px-3 py-2 font-bold">Paid</th>
                  <th className="text-right px-3 py-2 font-bold">Due</th>
                  <th className="text-center px-3 py-2 font-bold">Mode</th>
                </tr>
              </thead>
              <tbody>
                {oneWashTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-5 text-center text-slate-400 italic"
                    >
                      No onewash records found.
                    </td>
                  </tr>
                )}
                {oneWashTransactions.slice(0, 10).map((entry) => (
                  <tr
                    key={entry.id || `ow-${entry.serialNo}-${entry.billingMonth}`}
                    className="soa-compact-trim border-t border-slate-100"
                  >
                    <td className="px-3 py-2 text-slate-500">{entry.serialNo}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">
                      {entry.monthLabel}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {buildVehicleLabel(entry.registrationNo, entry.parkingNo)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatAmount(entry.baseAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-700 font-semibold">
                      {formatAmount(entry.tipAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                      {formatAmount(entry.paidAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-600 font-semibold">
                      {formatAmount(entry.dueAmount)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {entry.paymentMode || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            Wash Activity (Work Records)
          </div>
          <div className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 bg-slate-50">
            Total: {washActivitySummary.totalWashes || 0} | Completed: {washActivitySummary.completed || 0} | Pending: {washActivitySummary.pending || 0} | Rejected: {washActivitySummary.rejected || 0}
          </div>
          <div className="overflow-x-auto">
            <table className="soa-print-table w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">#</th>
                  <th className="text-left px-3 py-2 font-bold">Date</th>
                  <th className="text-left px-3 py-2 font-bold">Type</th>
                  <th className="text-left px-3 py-2 font-bold">Vehicle</th>
                  <th className="text-center px-3 py-2 font-bold">Status</th>
                  <th className="text-left px-3 py-2 font-bold">Worker</th>
                  <th className="text-right px-3 py-2 font-bold">Amount</th>
                  <th className="text-right px-3 py-2 font-bold">Tips</th>
                </tr>
              </thead>
              <tbody>
                {washActivityEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-5 text-center text-slate-400 italic"
                    >
                      No wash activity records found.
                    </td>
                  </tr>
                )}
                {washActivityEntries.slice(0, 10).map((entry) => (
                  <tr
                    key={entry.id || `wa-${entry.serialNo}-${entry.date}`}
                    className="soa-compact-trim border-t border-slate-100"
                  >
                    <td className="px-3 py-2 text-slate-500">{entry.serialNo}</td>
                    <td className="px-3 py-2 text-slate-700">{entry.date || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.activityType || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {buildVehicleLabel(entry.registrationNo, entry.parkingNo)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">{entry.status || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.workerName || "-"}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatAmount(entry.amount)}</td>
                    <td className="px-3 py-2 text-right text-amber-700 font-semibold">{formatAmount(entry.tipAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>Prepared By: ____________________</div>
          <div>Approved By: ____________________</div>
          <div>Signature: ____________________</div>
        </div>
      </div>
    </div>
  );
};

export default SOATemplateCard;
