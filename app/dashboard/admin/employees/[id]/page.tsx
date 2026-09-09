import { notFound } from "next/navigation";
import { activateEmployee, deactivateEmployee, getEmployeeById, updateEmployee } from "@/app/actions/profile";
import EmailStatusBadge from "@/components/admin/EmailStatusBadge";
import ResendCredentialsButton from "@/components/admin/ResendCredentialsButton";
import ConfirmModalClient from "@/components/ui/ConfirmModalClient";
import StatusBadge from "@/components/ui/StatusBadge";

export const metadata = { title: "Employee Details - Iruka Motors" };

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getEmployeeById(id);

  if (!result.success || !result.employee) {
    notFound();
  }

  const employee = result.employee;

  async function updateEmployeeAction(formData: FormData) {
    "use server";

    const name = (formData.get("name") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const jobTitle = (formData.get("jobTitle") as string) || "";
    const role = (formData.get("role") as "EMPLOYEE" | "MANAGER") || "EMPLOYEE";
    const isActive = formData.get("isActive") === "on";

    await updateEmployee(id, {
      name,
      phone,
      jobTitle,
      role,
      isActive,
    });
  }

  async function deactivateAction() {
    "use server";
    await deactivateEmployee(id);
  }

  async function activateAction() {
    "use server";
    await activateEmployee(id);
  }

  return (
    <div className="space-y-6 p-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">{employee.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{employee.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge label={employee.role} variant={employee.role === "MANAGER" ? "blue" : "yellow"} />
          <StatusBadge label={employee.isActive ? "Active" : "Inactive"} variant={employee.isActive ? "green" : "gray"} />
          <EmailStatusBadge status={employee.emailStatus} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Edit Employee</h2>
        <form action={updateEmployeeAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">Full Name</span>
            <input name="name" defaultValue={employee.name} className="w-full rounded-md border border-input bg-background px-3 py-2" required />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">Phone</span>
            <input name="phone" defaultValue={employee.phone || ""} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">Job Title</span>
            <input name="jobTitle" defaultValue={employee.jobTitle || ""} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">Role</span>
            <select name="role" defaultValue={employee.role} className="w-full rounded-md border border-input bg-background px-3 py-2">
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" name="isActive" defaultChecked={employee.isActive} />
            Account is active
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save Changes
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Account Actions</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ResendCredentialsButton employeeId={employee.id} employeeEmail={employee.email} />
          <ConfirmModalClient
            isActive={employee.isActive}
            deactivateAction={deactivateAction}
            activateAction={activateAction}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Email History</h2>
        {employee.emailLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No email history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Sent At</th>
                  <th className="py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {employee.emailLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/60">
                    <td className="py-2">{log.type}</td>
                    <td className="py-2">{log.status}</td>
                    <td className="py-2">{new Date(log.sentAt).toLocaleString()}</td>
                    <td className="py-2 text-rose-600">{log.errorMsg || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
