"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTaxInvoiceById } from "@/app/actions/tax-invoice";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
  invoiceId: string;
};

export default function InvoiceRowActions({ invoiceId }: Props) {
  const router = useRouter();
  const [isDeleting, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const printInvoice = () => {
    window.open(
      `/dashboard/employee/tax-invoice/history/${invoiceId}/print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDelete = () => {
    setError("");
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteTaxInvoiceById(invoiceId);
      if (!result.success) {
        setError(result.error ?? "Failed to delete invoice.");
        setShowConfirm(false);
        return;
      }

      setShowConfirm(false);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/employee/tax-invoice/history/${invoiceId}`}
          className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
        >
          View
        </Link>
        <Link
          href={`/dashboard/employee/tax-invoice/history/${invoiceId}/edit`}
          className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={printInvoice}
          className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Print
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Invoice?"
        message="This will permanently remove this invoice from history. This action cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}