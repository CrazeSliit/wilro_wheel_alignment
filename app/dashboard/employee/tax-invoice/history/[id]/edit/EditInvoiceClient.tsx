"use client";

import Link from "next/link";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InvoiceForm from "../../../InvoiceForm";
import InvoicePreview from "../../../InvoicePreview";
import { InvoiceData } from "@/lib/invoice-types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { updateTaxInvoiceById } from "@/app/actions/tax-invoice";

type Props = {
  invoiceId: string;
  initialData: InvoiceData;
};

export default function EditInvoiceClient({ invoiceId, initialData }: Props) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialData);
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

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

  const handleUpdate = async () => {
    setSaveError("");
    setSaveSuccess("");
    setIsSaving(true);

    const result = await updateTaxInvoiceById(invoiceId, invoiceData);

    setIsSaving(false);

    if (!result.success) {
      setSaveError(result.error ?? "Failed to update tax invoice.");
      return;
    }

    const invoiceNo = result.data?.taxInvoiceNo ?? "tax invoice";
    setSaveSuccess(`Updated ${invoiceNo} successfully.`);
  };

  const handlePrint = () => {
    window.open(
      `/dashboard/employee/tax-invoice/history/${invoiceId}/print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <div className="no-print px-8 pt-6 pb-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/employee/tax-invoice/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition"
          >
            History
          </Link>

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

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Print / PDF
          </button>

          <button
            onClick={handleUpdate}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {isSaving && <LoadingSpinner size="sm" />}
            Save Changes
          </button>
        </div>
      </div>

      {saveError && (
        <div className="px-8 pt-5 no-print">
          <ErrorAlert message={saveError} onDismiss={() => setSaveError("")} />
        </div>
      )}

      {saveSuccess && (
        <div className="px-8 pt-5 no-print">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saveSuccess}{" "}
            <Link
              href="/dashboard/employee/tax-invoice/history"
              className="font-semibold underline underline-offset-2"
            >
              Back to history
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1 p-8 overflow-auto">
        <div className={tab === "form" ? "block no-print" : "hidden no-print"}>
          <InvoiceForm data={invoiceData} onChange={setInvoiceData} />
        </div>

        <div
          className={
            tab === "preview"
              ? "overflow-x-auto flex justify-center"
              : "overflow-x-auto invisible h-0 overflow-hidden"
          }
        >
          <div className="flex flex-col items-center">
            <InvoicePreview data={invoiceData} />
          </div>
        </div>
      </div>
    </>
  );
}
