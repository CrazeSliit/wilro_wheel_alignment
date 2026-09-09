"use client";

import { useState, useTransition } from "react";
import { toggleInvoicePaid } from "@/app/actions/tax-invoice";

type Props = {
  invoiceId: string;
  initialIsPaid: boolean;
};

export default function InvoicePaidToggle({ invoiceId, initialIsPaid }: Props) {
  const [isPaid, setIsPaid] = useState(initialIsPaid);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    setShowConfirm(true);
  };

  const confirmToggle = (newValue: boolean) => {
    setShowConfirm(false);
    setIsPaid(newValue);
    startTransition(async () => {
      const result = await toggleInvoicePaid(invoiceId, newValue);
      if (!result.success) setIsPaid(!newValue);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-60 ${
          isPaid
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
        }`}
      >
        {isPaid ? (
          <>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Paid
          </>
        ) : (
          <>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Unpaid
          </>
        )}
      </button>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPaid ? "bg-red-100" : "bg-emerald-100"}`}>
                {isPaid ? (
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                )}
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {isPaid ? "Mark as Unpaid?" : "Mark as Paid?"}
              </h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to mark this invoice as{" "}
              {isPaid ? (
                <span className="font-semibold text-red-600">Unpaid</span>
              ) : (
                <span className="font-semibold text-emerald-600">Paid</span>
              )}
              ? This will update the payment status.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmToggle(!isPaid)}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white transition ${isPaid ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {isPaid ? "Yes, Mark Unpaid" : "Yes, Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
