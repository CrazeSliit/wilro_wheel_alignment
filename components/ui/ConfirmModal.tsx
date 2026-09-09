"use client";

import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "info",
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700"
      : variant === "warning"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-primary hover:opacity-90";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground" disabled={isLoading}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${confirmClass}`} disabled={isLoading}>
            {isLoading && <LoadingSpinner size="sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
