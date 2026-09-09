import Link from "next/link";
import EmailStatusBadge from "@/components/admin/EmailStatusBadge";
import StatusBadge from "@/components/ui/StatusBadge";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  jobTitle: string | null;
  role: "ADMIN" | "EMPLOYEE" | "MANAGER";
  isActive: boolean;
  emailStatus: "SENT" | "FAILED" | "PENDING";
};

export default function EmployeeCard({ employee }: { employee: Employee }) {
  const initials = employee.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{employee.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {employee.department || "No department"} {employee.jobTitle ? `| ${employee.jobTitle}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge label={employee.role} variant={employee.role === "MANAGER" ? "blue" : employee.role === "ADMIN" ? "gray" : "yellow"} />
        <StatusBadge label={employee.isActive ? "Active" : "Inactive"} variant={employee.isActive ? "green" : "gray"} />
        <EmailStatusBadge status={employee.emailStatus} />
      </div>
      <div className="mt-3">
        <Link href={`/dashboard/admin/employees/${employee.id}`} className="text-xs font-medium text-primary hover:underline">
          View profile
        </Link>
      </div>
    </div>
  );
}
