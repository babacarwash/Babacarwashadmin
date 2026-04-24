import React from "react";

const toNumberSafe = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) => toNumberSafe(value).toFixed(2);

const cleanDueDate = (value) => {
  const normalized = String(value || "")
    .replace(/\s*\(Paid\)\s*/gi, "")
    .trim();
  return normalized || "-";
};

const buildPeriodCode = () => {
  const now = new Date();
  const monthCode = now
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const yearCode = String(now.getFullYear()).slice(-2);
  return `${monthCode}/${yearCode} SOA`;
};

const SOAPrintSlip = ({ soaData, selectedVehicleLabel, monthRangeLabel }) => {
  const customer = soaData?.customer || {};
  const summary = soaData?.summary || {};
  const insights = soaData?.insights || {};
  const monthly = Array.isArray(soaData?.monthly) ? soaData.monthly : [];
  const oneWashSummary = soaData?.oneWash?.summary || {};
  const washActivitySummary = soaData?.washActivity?.summary || {};

  const monthlyRows =
    monthly.length > 0
      ? monthly.map((row) => ({
          date: cleanDueDate(row?.dueDateDisplay || row?.dueDate),
          particulars: `${String(row?.monthLabel || "-").toUpperCase()} MONTHLY BILLING`,
          type: "Dr",
          debit: toNumberSafe(row?.billedAmount),
          credit: toNumberSafe(row?.paidAmount),
        }))
      : [
          {
            date: "-",
            particulars: "NO MONTHLY RECORDS AVAILABLE",
            type: "Dr",
            debit: toNumberSafe(summary?.totalBilled),
            credit: toNumberSafe(summary?.totalPaid),
          },
        ];

  const oneWashRows = [];
  if (
    toNumberSafe(oneWashSummary.totalBaseAmount) > 0 ||
    toNumberSafe(oneWashSummary.totalTips) > 0 ||
    toNumberSafe(oneWashSummary.totalPaid) > 0 ||
    Number(oneWashSummary.count || 0) > 0
  ) {
    oneWashRows.push({
      date: "-",
      particulars: "ONEWASH BASE AMOUNT",
      type: "Dr",
      debit: toNumberSafe(oneWashSummary.totalBaseAmount),
      credit: 0,
    });

    if (toNumberSafe(oneWashSummary.totalTips) > 0) {
      oneWashRows.push({
        date: "-",
        particulars: "ONEWASH TIPS",
        type: "Dr",
        debit: toNumberSafe(oneWashSummary.totalTips),
        credit: 0,
      });
    }

    oneWashRows.push({
      date: "-",
      particulars: "ONEWASH COLLECTED",
      type: "Cr",
      debit: 0,
      credit: toNumberSafe(oneWashSummary.totalPaid),
    });
  }

  const statementRows = [...monthlyRows, ...oneWashRows];

  const totalDebit = statementRows.reduce(
    (acc, item) => acc + toNumberSafe(item.debit),
    0,
  );
  const totalCredit = statementRows.reduce(
    (acc, item) => acc + toNumberSafe(item.credit),
    0,
  );
  const closingBalance = toNumberSafe(summary?.overallDue ?? summary?.totalDue);

  const styles = {
    sheet: {
      width: "297mm",
      minHeight: "210mm",
      padding: "8mm",
      backgroundColor: "#ffffff",
      color: "#1f2937",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxSizing: "border-box",
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      overflow: "hidden",
    },
    topTitle: {
      margin: 0,
      textAlign: "center",
      color: "#dc2626",
      fontWeight: 800,
      fontSize: "11pt",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    topRule: {
      borderTop: "3px solid #ef4444",
      margin: "6px 0 10px",
    },
    infoTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "8px",
      fontSize: "8pt",
      fontWeight: 700,
      textTransform: "uppercase",
    },
    ledgerTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "8pt",
      marginBottom: "8px",
    },
    th: {
      border: "1px solid #64748b",
      backgroundColor: "#1e293b",
      color: "#ffffff",
      padding: "5px",
      textTransform: "uppercase",
      fontWeight: 700,
      textAlign: "center",
    },
    td: {
      border: "1px solid #94a3b8",
      padding: "4px 6px",
      verticalAlign: "middle",
    },
    tdRight: {
      border: "1px solid #94a3b8",
      padding: "4px 6px",
      textAlign: "right",
      verticalAlign: "middle",
    },
    warningBox: {
      border: "1px solid #ef4444",
      color: "#7f1d1d",
      fontSize: "7.5pt",
      fontStyle: "italic",
      textAlign: "center",
      padding: "5px",
      margin: "8px 0",
      backgroundColor: "#fef2f2",
    },
    signatureWrap: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "22px",
      fontSize: "8.5pt",
      fontWeight: 700,
    },
    signatureItem: {
      width: "38%",
      borderTop: "2px solid #64748b",
      paddingTop: "7px",
      textAlign: "center",
    },
  };

  return (
    <div className="soa-print-only" aria-hidden="true">
      <div id="printable-soa-slip" style={styles.sheet}>
        <h2 style={styles.topTitle}>Baba Car Washing And Cleaning LLC</h2>
        <div style={styles.topRule} />

        <table style={styles.infoTable}>
          <tbody>
            <tr>
              <td style={{ ...styles.td, width: "40%" }}>
                NAME : {String(customer.fullName || "-").toUpperCase()}
              </td>
              <td style={{ ...styles.td, width: "30%", textAlign: "center" }}>
                CODE : {customer.customerCode || "-"}
              </td>
              <td style={{ ...styles.td, width: "30%", textAlign: "right" }}>
                {buildPeriodCode()}
              </td>
            </tr>
            <tr>
              <td style={styles.td}>MOBILE : {customer.mobile || "-"}</td>
              <td style={{ ...styles.td, textAlign: "center" }}>
                SCOPE :{" "}
                {String(selectedVehicleLabel || "All Vehicles").toUpperCase()}
              </td>
              <td style={{ ...styles.td, textAlign: "right" }}>
                RANGE : {String(monthRangeLabel || "All Months").toUpperCase()}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={styles.ledgerTable}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: "12%" }}>Date</th>
              <th style={{ ...styles.th, textAlign: "left" }}>Particulars</th>
              <th style={{ ...styles.th, width: "8%" }}>Type</th>
              <th style={{ ...styles.th, width: "18%" }}>Debit</th>
              <th style={{ ...styles.th, width: "18%" }}>Credit</th>
            </tr>
          </thead>
          <tbody>
            {statementRows.map((item, index) => (
              <tr key={`${item.particulars}-${index}`}>
                <td style={styles.td}>{item.date}</td>
                <td style={styles.td}>{item.particulars}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  {item.type}
                </td>
                <td style={styles.tdRight}>{formatMoney(item.debit)}</td>
                <td style={styles.tdRight}>{formatMoney(item.credit)}</td>
              </tr>
            ))}

            <tr>
              <td style={styles.td} />
              <td style={{ ...styles.td, fontWeight: 800, textAlign: "right" }}>
                TOTAL
              </td>
              <td style={styles.td} />
              <td style={{ ...styles.tdRight, fontWeight: 800 }}>
                {formatMoney(totalDebit)}
              </td>
              <td style={{ ...styles.tdRight, fontWeight: 800 }}>
                {formatMoney(totalCredit)}
              </td>
            </tr>

            <tr>
              <td style={styles.td} />
              <td style={{ ...styles.td, fontWeight: 800, textAlign: "right" }}>
                CLOSING BALANCE
              </td>
              <td style={styles.td} />
              <td style={styles.td} />
              <td
                style={{
                  ...styles.tdRight,
                  fontWeight: 800,
                  color: "#ffffff",
                  backgroundColor: "#dc2626",
                }}
              >
                {formatMoney(closingBalance)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={styles.warningBox}>
          Keep this statement for records. Any payment disputes must be reported
          with receipt proof.
        </div>

        <table style={styles.infoTable}>
          <tbody>
            <tr>
              <td style={{ ...styles.td, width: "25%" }}>
                MONTHS COVERED : {summary.monthsCovered || 0}
              </td>
              <td style={{ ...styles.td, width: "25%", textAlign: "center" }}>
                DUE MONTHS : {insights.monthsWithDue || 0}
              </td>
              <td style={{ ...styles.td, width: "25%", textAlign: "center" }}>
                COLLECTION % : {Number(summary.overallCollectionPercent || summary.collectionPercent || 0).toFixed(1)}
              </td>
              <td style={{ ...styles.td, width: "25%", textAlign: "right" }}>
                LAST PAYMENT : {summary.lastPaymentDate || "-"}
              </td>
            </tr>
            <tr>
              <td style={{ ...styles.td, width: "25%" }}>
                ONEWASH COUNT : {oneWashSummary.count || 0}
              </td>
              <td style={{ ...styles.td, width: "25%", textAlign: "center" }}>
                ONEWASH TIPS : {formatMoney(oneWashSummary.totalTips)}
              </td>
              <td style={{ ...styles.td, width: "25%", textAlign: "center" }}>
                WASHES : {washActivitySummary.totalWashes || 0}
              </td>
              <td style={{ ...styles.td, width: "25%", textAlign: "right" }}>
                COMPLETED : {washActivitySummary.completed || 0}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={styles.signatureWrap}>
          <div style={styles.signatureItem}>Prepared By Signatory</div>
          <div style={styles.signatureItem}>Received By Signatory</div>
        </div>
      </div>
    </div>
  );
};

export default SOAPrintSlip;
