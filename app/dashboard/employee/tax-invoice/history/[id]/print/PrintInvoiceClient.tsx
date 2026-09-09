"use client";

import { useEffect } from "react";
import Link from "next/link";
import InvoicePreview from "../../../InvoicePreview";
import type { InvoiceData } from "@/lib/invoice-types";

export default function PrintInvoiceClient({ invoiceData }: { invoiceData: InvoiceData }) {
  useEffect(() => {
    const el = document.getElementById("invoice-preview");
    if (!el) return;

    const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title></title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: white; width: 210mm; }
  #invoice-preview { display: flex; flex-direction: column; gap: 0; }
  .invoice-page { width: 210mm; height: 297mm; overflow: hidden; box-shadow: none; break-after: page; page-break-after: always; }
  .invoice-page:last-child { break-after: auto; page-break-after: auto; }
</style>
</head><body>${el.outerHTML}</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWin = window.open(blobUrl, "_blank");
    if (!printWin) { URL.revokeObjectURL(blobUrl); return; }

    setTimeout(() => {
      printWin.focus();
      printWin.print();
      printWin.close();
      URL.revokeObjectURL(blobUrl);
    }, 500);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="no-print border-b border-border px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Print Tax Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">The browser print dialog opens automatically.</p>
        </div>
        <Link href="/dashboard/employee/tax-invoice/history" className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
          Back to History
        </Link>
      </div>

      <div className="print-scroll-wrapper flex-1 overflow-auto bg-muted/20 p-8">
        <div className="print-inner mx-auto overflow-x-auto">
          <InvoicePreview data={invoiceData} />
        </div>
      </div>
    </div>
  );
}
