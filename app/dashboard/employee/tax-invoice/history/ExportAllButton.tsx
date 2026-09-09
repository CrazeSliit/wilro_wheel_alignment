"use client";

import { useState } from "react";
import { utils, writeFile } from "xlsx";
import { getAllInvoicesForExport } from "@/app/actions/tax-invoice";

const HEADERS = [
  "Invoice No.",
  "Date",
  "Purchaser Name",
  "Place of Supply",
  "Payment Mode",
  "Total (Rs.)",
  "Payment Status",
  "Additional Information",
  "Created By",
  "Created At",
];

const COL_WIDTHS = [18, 14, 24, 20, 16, 14, 14, 40, 20, 20];

export default function ExportAllButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");
    setIsLoading(true);

    const result = await getAllInvoicesForExport();

    setIsLoading(false);

    if (!result.success || !result.data) {
      setError(result.error ?? "Export failed.");
      return;
    }

    const rows = result.data;

    const sheetData: (string | number)[][] = [
      HEADERS,
      ...rows.map((r) => [
        r.taxInvoiceNo,
        r.invoiceDate,
        r.purchaserName ?? "",
        r.placeOfSupply ?? "",
        r.paymentMode ?? "",
        r.totalAmount,
        r.isPaid ? "Paid" : "Unpaid",
        r.additionalInfo ?? "",
        r.createdBy,
        r.createdAt,
      ]),
    ];

    const ws = utils.aoa_to_sheet(sheetData);
    ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));

    const lastRow = rows.length;
    ws["!autofilter"] = { ref: `A1:J1` };
    ws["!tables"] = [
      {
        name: "AllInvoicesTable",
        ref: `A1:J${lastRow + 1}`,
        headerRow: true,
        totalsRow: false,
        styleInfo: {
          themeIndex: 9,
          showFirstColumn: false,
          showLastColumn: false,
          showRowStripes: true,
          showColumnStripes: false,
        },
        columns: HEADERS.map((h) => ({ name: h })),
      },
    ] as never;

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "All Invoices");

    const ts = new Date().toISOString().slice(0, 10);
    writeFile(wb, `all-tax-invoices-${ts}.xlsx`);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg
              className="w-3.5 h-3.5 shrink-0 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Exporting…
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 16v-8M8 12l4 4 4-4" />
              <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
            </svg>
            Export All to Excel
          </>
        )}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
