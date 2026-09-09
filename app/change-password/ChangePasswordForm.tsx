"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/app/actions/auth";
import ErrorAlert from "@/components/ui/ErrorAlert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasLength = newPassword.length >= 8;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword, confirmPassword);
    setLoading(false);

    if (!result.success || !result.data) {
      setError(result.error || "Failed to update password.");
      return;
    }

    router.push(result.data.redirect);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <PasswordField
        label="Current Password (from your welcome email)"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showCurrent}
        onToggle={() => setShowCurrent((v) => !v)}
      />

      <PasswordField
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        show={showNew}
        onToggle={() => setShowNew((v) => !v)}
      />

      <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <p>Password rules:</p>
        <p className={hasLength ? "text-emerald-700" : ""}>At least 8 characters</p>
        <p className={hasUpper ? "text-emerald-700" : ""}>Contains uppercase letter</p>
        <p className={hasNumber ? "text-emerald-700" : ""}>Contains number</p>
      </div>

      <PasswordField
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showConfirm}
        onToggle={() => setShowConfirm((v) => !v)}
      />

      {confirmPassword && newPassword !== confirmPassword && (
        <p className="text-xs text-rose-600">Passwords do not match.</p>
      )}

      <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {loading && <LoadingSpinner size="sm" />}
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-input bg-background">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 outline-none"
          required
        />
        <button type="button" onClick={onToggle} className="border-l border-border px-3 text-xs text-muted-foreground">
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
