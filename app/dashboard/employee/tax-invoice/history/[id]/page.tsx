import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import InvoicePreview from "../../InvoicePreview";
import { InvoiceData } from "@/lib/invoice-types";

export const metadata = { title: "Tax Invoice Details — Iruka Motors" };

export default async function TaxInvoiceHistoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

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
    },
  });

  if (!invoice) notFound();

  const invoiceData = invoice.invoiceData as unknown as InvoiceData;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border px-8 py-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tax Invoice Details</p>
            <h1 className="text-2xl font-bold text-foreground">{invoice.taxInvoiceNo}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created on {invoice.createdAt.toLocaleString("en-US")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/employee/tax-invoice/history"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
            >
              Back to History
            </Link>
            <Link
              href={`/dashboard/employee/tax-invoice/history/${invoice.id}/edit`}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
            >
              Edit
            </Link>
            <Link
              href={`/dashboard/employee/tax-invoice/history/${invoice.id}/print`}
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