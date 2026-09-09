"use client";

import { useState } from "react";
import { resendCredentials } from "@/app/actions/auth";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorAlert from "@/components/ui/ErrorAlert";

type Props = {
  employeeId: string;
  employeeEmail: string;
};

export default function ResendCredentialsButton({ employeeId, employeeEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await resendCredentials(employeeId);

    setLoading(false);
    setOpen(false);

    if (!result.success) {
      setError(result.error || "Failed to resend credentials.");
      return;
    }

    setMessage(`New credentials sent to ${employeeEmail}.`);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100"
      >
        Resend Credentials
      </button>

      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <ConfirmModal
        isOpen={open}
        title="Resend credentials?"
        message={`This will generate a new password and send it to ${employeeEmail}. The employee will be forced to change it on next login.`}
        confirmLabel="Yes, resend"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        isLoading={loading}
        variant="warning"
      />
    </div>
  );
}
