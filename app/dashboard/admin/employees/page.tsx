import Link from "next/link";
import { getAllEmployees } from "@/app/actions/profile";
import EmployeeTable from "@/components/admin/EmployeeTable";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Employees - Iruka Motors" };

type SearchParams = Promise<{ search?: string; page?: string }>;

export default async function EmployeesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page || "1");

  const result = await getAllEmployees(search, Number.isNaN(page) ? 1 : Math.max(page, 1), 20);
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));
  const currentPage = Math.min(result.page, totalPages);
  const start = result.total === 0 ? 0 : (currentPage - 1) * result.limit + 1;
  const end = Math.min(currentPage * result.limit, result.total);

  return (
    <div className="p-8">
      <PageHeader
        title="Employee Accounts"
        subtitle="Manage all employee accounts"
        actionLabel="Add New Employee"
        actionHref="/dashboard/admin/employees/create"
      />

      <form className="mb-4" action="/dashboard/admin/employees" method="get">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:max-w-sm"
        />
      </form>

      <EmployeeTable employees={result.employees} />

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {start}-{end} of {result.total} employees
        </p>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/admin/employees?search=${encodeURIComponent(search)}&page=${Math.max(1, currentPage - 1)}`}
            className={`rounded border border-border px-3 py-1 ${currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
          >
            Previous
          </Link>
          <Link
            href={`/dashboard/admin/employees?search=${encodeURIComponent(search)}&page=${Math.min(totalPages, currentPage + 1)}`}
            className={`rounded border border-border px-3 py-1 ${currentPage >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
