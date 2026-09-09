import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import InvoicePreview from "@/app/dashboard/employee/tax-invoice/InvoicePreview";
import { InvoiceData } from "@/lib/invoice-types";

export const metadata = { title: "Admin Tax Invoice Preview - Iruka Motors" };

export default async function AdminInvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard/employee");

  const { id } = await params;

  const invoice = await prisma.taxInvoice.findUnique({
    where: { id },
    select: {
      id: true,
      taxInvoiceNo: true,
      invoiceDate: true,
      purchaserName: true,
      paymentMode: true,
      totalAmount: true,
      createdAt: true,
      invoiceData: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invoice) notFound();

  const invoiceData = invoice.invoiceData as unknown as InvoiceData;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border px-8 py-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Admin Invoice Preview</p>
            <h1 className="text-2xl font-bold text-foreground">{invoice.taxInvoiceNo}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created by {invoice.user.name} ({invoice.user.email}) on {invoice.createdAt.toLocaleString("en-US")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/reports"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
            >
              Back to Reports
            </Link>
            <Link
              href={`/dashboard/admin/reports/${invoice.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
            >
              Print
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/20 p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm no-print">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invoice No.</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{invoice.taxInvoiceNo}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invoice Date</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{invoice.invoiceDate.toLocaleDateString("en-US")}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Purchaser</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{invoice.purchaserName || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment Mode</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{invoice.paymentMode || "Not provided"}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-x-auto">
            <InvoicePreview data={invoiceData} />
          </div>
        </div>
      </div>
    </div>
  );
}
