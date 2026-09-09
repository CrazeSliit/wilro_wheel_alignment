"use client";

import Link from "next/link";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InvoiceForm from "./InvoiceForm";
import InvoicePreview from "./InvoicePreview";
import { InvoiceData, defaultInvoiceData } from "@/lib/invoice-types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { saveTaxInvoice } from "@/app/actions/tax-invoice";

export default function TaxInvoicePage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoiceData);
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess("");
    setIsSaving(true);

    const result = await saveTaxInvoice(invoiceData);

    setIsSaving(false);

    if (!result.success) {
      setSaveError(result.error ?? "Failed to save tax invoice.");
      return;
    }

    const invoiceNo = result.data?.taxInvoiceNo ?? "tax invoice";
    setSaveSuccess(`Saved ${invoiceNo} to your history.`);
  };

  const handlePrint = () => {
    const el = document.getElementById("invoice-preview");
    if (!el) { window.print(); return; }

    const printWin = window.open("", "_blank");
    if (!printWin) { window.print(); return; }

    printWin.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Tax Invoice</title>
<style>
  @page { size: A4 portrait; margin: 0mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: white; }
  #invoice-preview { display: flex; flex-direction: column; gap: 0; }
  .invoice-page { width: 210mm; min-height: 297mm; height: auto; overflow: visible; box-shadow: none; break-after: page; page-break-after: always; }
  .invoice-page:last-child { break-after: auto; page-break-after: auto; }
</style>
</head><body>${el.outerHTML}</body></html>`);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  const handleAddSheet = () => {
    setInvoiceData((prev) => ({
      ...prev,
      extraSheets: [
        ...prev.extraSheets,
        {
          id: uuidv4(),
          lineItems: [{ id: uuidv4(), reference: "", description: "", quantity: 0, unitPrice: 0 }],
        },
      ],
    }));
    setTab("form");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Header ──────────────────────────────────── */}
      <div className="no-print px-8 pt-8 pb-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tax Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the details, preview, then print or save as PDF.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/employee/tax-invoice/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition"
          >
            History
          </Link>

          {/* Tab switcher */}
          <div className="flex bg-muted rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setTab("form")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === "form"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Edit Invoice
            </button>
            <button
              onClick={() => setTab("preview")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === "preview"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Preview
            </button>
          </div>

          {/* Add New Sheet */}
          <button
            onClick={handleAddSheet}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add New Sheet
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print / PDF
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {isSaving && <LoadingSpinner size="sm" />}
            Save to History
          </button>
        </div>
      </div>

      {saveError && (
        <div className="px-8 pt-5">
          <ErrorAlert message={saveError} onDismiss={() => setSaveError("")} />
        </div>
      )}

      {saveSuccess && (
        <div className="px-8 pt-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saveSuccess} <Link href="/dashboard/employee/tax-invoice/history" className="font-semibold underline underline-offset-2">View history</Link>
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────── */}
      <div className="flex-1 p-8 overflow-auto">

        <div className={tab === "form" ? "block no-print" : "hidden no-print"}>
          <InvoiceForm data={invoiceData} onChange={setInvoiceData} />
        </div>

        <div className={tab === "preview" ? "overflow-x-auto flex justify-center" : "overflow-x-auto invisible h-0 overflow-hidden"}>
          <div className="flex flex-col items-center">
            <InvoicePreview data={invoiceData} />
          </div>
        </div>
      </div>
    </div>
  );
}
