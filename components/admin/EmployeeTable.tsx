"use client";

import Link from "next/link";
import EmailStatusBadge from "@/components/admin/EmailStatusBadge";
import EmployeeCard from "@/components/admin/EmployeeCard";
import ResendCredentialsButton from "@/components/admin/ResendCredentialsButton";
import StatusBadge from "@/components/ui/StatusBadge";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: "ADMIN" | "EMPLOYEE" | "MANAGER";
  isActive: boolean;
  emailStatus: "SENT" | "FAILED" | "PENDING";
  jobTitle: string | null;
};

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">No employees found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {employees.map((employee) => (
              <tr key={employee.id} className={employee.emailStatus === "FAILED" ? "bg-rose-50/60" : ""}>
                <td className="px-4 py-3 font-medium text-foreground">{employee.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{employee.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{employee.department || "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={employee.role} variant={employee.role === "MANAGER" ? "blue" : employee.role === "ADMIN" ? "gray" : "yellow"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={employee.isActive ? "Active" : "Inactive"} variant={employee.isActive ? "green" : "gray"} />
                </td>
                <td className="px-4 py-3">
                  <EmailStatusBadge status={employee.emailStatus} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/admin/employees/${employee.id}`} className="rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted">
                      View
                    </Link>
                    <ResendCredentialsButton employeeId={employee.id} employeeEmail={employee.email} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
