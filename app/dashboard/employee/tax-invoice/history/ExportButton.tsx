"use client";

import { utils, writeFile } from "xlsx";

export type ExportRow = {
  taxInvoiceNo: string;
  invoiceDate: string;       // pre-formatted ISO date string
  placeOfSupply: string | null;
  paymentMode: string | null;
  totalAmount: number;
  isPaid: boolean;
  additionalInfo: string | null;
};

type Props = {
  rows: ExportRow[];
  filename?: string;
};

const HEADERS = [
  "Invoice No.",
  "Date",
  "Place of Supply",
  "Payment Mode",
  "Total (Rs.)",
  "Payment",
  "Additional Information",
];

const COL_WIDTHS = [18, 14, 20, 16, 14, 10, 40];

export default function ExportButton({ rows, filename = "tax-invoices" }: Props) {
  const handleExport = () => {
    // Build rows as arrays (header first)
    const sheetData: (string | number)[][] = [
      HEADERS,
      ...rows.map((r) => [
        r.taxInvoiceNo,
        r.invoiceDate,
        r.placeOfSupply ?? "",
        r.paymentMode ?? "",
        r.totalAmount,
        r.isPaid ? "Paid" : "Unpaid",
        r.additionalInfo ?? "",
      ]),
    ];

    const ws = utils.aoa_to_sheet(sheetData);

    // Column widths
    ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));

    // Register the range as an Excel Table (ListObject)
    const lastRow = rows.length; // 0-based: header=0, data rows=1..lastRow
    ws["!autofilter"] = { ref: `A1:G1` };
    ws["!tables"] = [
      {
        name: "InvoiceTable",
        ref: `A1:G${lastRow + 1}`,
        headerRow: true,
        totalsRow: false,
        styleInfo: {
          themeIndex: 9,   // "TableStyleMedium9" — blue
          showFirstColumn: false,
          showLastColumn: false,
          showRowStripes: true,
          showColumnStripes: false,
        },
        columns: HEADERS.map((h) => ({ name: h })),
      },
    ] as never;

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Invoices");

    const ts = new Date().toISOString().slice(0, 10);
    writeFile(wb, `${filename}-${ts}.xlsx`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="self-end inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 16v-8M8 12l4 4 4-4" />
        <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
      </svg>
      Export Excel
      {rows.length > 0 && (
        <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
          {rows.length}
        </span>
      )}
    </button>
  );
}
