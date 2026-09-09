import Link from "next/link";

export default function SuccessAlert({ email, onCreateAnother }: { email: string; onCreateAnother?: () => void }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
      <h3 className="text-lg font-semibold text-emerald-800">Account Created Successfully</h3>
      <p className="mt-2 text-sm text-emerald-700">Login credentials have been sent to {email}.</p>
      <p className="mt-1 text-sm text-emerald-700">The employee must change password on first login.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {onCreateAnother && (
          <button
            type="button"
            onClick={onCreateAnother}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Create Another Employee
          </button>
        )}
        <Link href="/dashboard/admin/employees" className="rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
          View All Employees
        </Link>
      </div>
    </div>
  );
}
