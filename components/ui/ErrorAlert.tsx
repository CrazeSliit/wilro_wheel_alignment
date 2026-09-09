"use client";

import { useEffect, useState } from "react";

export default function ErrorAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(false);
      onDismiss?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!open) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <p>{message}</p>
      <button type="button" onClick={() => { setOpen(false); onDismiss?.(); }} className="text-rose-700/70 hover:text-rose-900" aria-label="Dismiss">
        x
      </button>
    </div>
  );
}
