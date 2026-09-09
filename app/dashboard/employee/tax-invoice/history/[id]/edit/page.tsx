import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTaxInvoiceById } from "@/app/actions/tax-invoice";
import EditInvoiceClient from "./EditInvoiceClient";

export const metadata = { title: "Edit Tax Invoice - Iruka Motors" };

export default async function EditTaxInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const result = await getTaxInvoiceById(id);

  if (!result.success || !result.data) {
    if (result.error === "Not authenticated.") redirect("/login");
    if (result.error === "Not authorized.") redirect("/dashboard/employee/tax-invoice/history");
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tax Invoice</p>
            <h1 className="text-2xl font-bold text-foreground">Edit Invoice</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update details and save changes to history.
            </p>
          </div>

          <Link
            href="/dashboard/employee/tax-invoice/history"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
          >
            Back to History
          </Link>
        </div>
      </div>

      <EditInvoiceClient invoiceId={id} initialData={result.data} />
    </div>
  );
}
