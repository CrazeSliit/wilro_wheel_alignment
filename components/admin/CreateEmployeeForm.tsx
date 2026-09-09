"use client";

import { useState, type FormEvent } from "react";
import { createEmployeeAccount } from "@/app/actions/auth";
import ErrorAlert from "@/components/ui/ErrorAlert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SuccessAlert from "@/components/ui/SuccessAlert";

type FormDataState = {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: "EMPLOYEE" | "MANAGER";
};

const initialData: FormDataState = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  role: "EMPLOYEE",
};

export default function CreateEmployeeForm() {
  const [form, setForm] = useState<FormDataState>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email.";
    if (!form.jobTitle.trim()) nextErrors.jobTitle = "Job title is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    const result = await createEmployeeAccount({
      name: form.name,
      email: form.email,
      phone: form.phone,
      jobTitle: form.jobTitle,
      role: form.role,
    });
    setLoading(false);

    if (!result.success || !result.data) {
      setError(result.error || "Failed to create employee.");
      return;
    }

    setSuccessEmail(result.data.email);
    setForm(initialData);
    setErrors({});
  };

  if (successEmail) {
    return <SuccessAlert email={successEmail} onCreateAnother={() => setSuccessEmail(null)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full Name" required error={errors.name}>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={loading} />
        </Field>

        <Field label="Email" required error={errors.email}>
          <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={loading} />
        </Field>

        <Field label="Phone" error={errors.phone}>
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={loading} />
        </Field>

        <Field label="Job Title" required error={errors.jobTitle}>
          <input value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={loading} />
        </Field>

        <Field label="Role" required>
          <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as FormDataState["role"] }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={loading}>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
          </select>
        </Field>
      </div>

      <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {loading && <LoadingSpinner size="sm" />}
        {loading ? "Creating account..." : "Create Employee"}
      </button>
    </form>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">
        {label} {required ? "*" : ""}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
