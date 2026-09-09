import Link from "next/link";
import CreateEmployeeForm from "@/components/admin/CreateEmployeeForm";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Create Employee - Iruka Motors" };

export default function CreateEmployeePage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Create New Employee"
        subtitle="Fill in details to create an account and send login credentials"
      />

      <Link href="/dashboard/admin/employees" className="mb-4 inline-block text-sm font-medium text-primary hover:underline">
        Back to Employees
      </Link>

      <CreateEmployeeForm />
    </div>
  );
}
