import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { InvoiceData, computeExVAT } from "@/lib/invoice-types";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import InvoiceRowActions from "./InvoiceRowActions";
import InvoicePaidToggle from "./InvoicePaidToggle";
import InvoiceFilters from "./InvoiceFilters";
import ExportButton from "./ExportButton";
import ExportAllButton from "./ExportAllButton";

export const metadata = { title: "Tax Invoice History — Iruka Motors" };

const PAGE_SIZE = 15;

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function calcTotalFromData(raw: unknown): number {
  const data = raw as Partial<InvoiceData> | null;
  if (!data) return 0;
  return computeExVAT({
    lineItems: data.lineItems ?? [],
    extraSheets: data.extraSheets ?? [],
    commonPricing: data.commonPricing,
    commonAmount: data.commonAmount,
  }) * 1.18;
}

type SearchParams = Promise<{
  search?: string;
  payment?: string;
  mode?: string;
  from?: string;
  page?: string;
}>;

function buildWhere(search: string, payment: string, mode: string, from: string): Prisma.TaxInvoiceWhereInput {
  const where: Prisma.TaxInvoiceWhereInput = {};

  if (search) {
    where.OR = [
      { taxInvoiceNo: { contains: search, mode: "insensitive" } },
      { purchaserName: { contains: search, mode: "insensitive" } },
      { placeOfSupply: { contains: search, mode: "insensitive" } },
      { additionalInfo: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (payment === "paid") where.isPaid = true;
  if (payment === "unpaid") where.isPaid = false;
  if (mode) where.paymentMode = mode;

  if (from) {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    where.invoiceDate = {
      gte: start,
      lt: end,
    };
  }

  return where;
}

export default async function TaxInvoiceHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { search = "", payment = "", mode = "", from = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const where = buildWhere(search, payment, mode, from);

  const [totalCount, allInvoiceDataRows, paymentModeRows, invoiceRows] = await Promise.all([
    prisma.taxInvoice.count({ where }),
    prisma.taxInvoice.findMany({ where, select: { invoiceData: true } }),
    prisma.taxInvoice.findMany({
      where,
      select: { paymentMode: true },
      distinct: ["paymentMode"],
      orderBy: { paymentMode: "asc" },
    }),
    prisma.taxInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        taxInvoiceNo: true,
        invoiceDate: true,
        purchaserName: true,
        paymentMode: true,
        placeOfSupply: true,
        additionalInfo: true,
        totalAmount: true,
        isPaid: true,
        invoiceData: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const grandTotal = allInvoiceDataRows.reduce(
    (sum, r) => sum + calcTotalFromData(r.invoiceData),
    0
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const rows = invoiceRows.map((inv) => {
    const data = inv.invoiceData as Partial<InvoiceData> | null;
    return {
      ...inv,
      placeOfSupply: inv.placeOfSupply || (data?.placeOfSupply ?? null),
      purchaserName: inv.purchaserName || (data?.purchaserName ?? null),
      additionalInfo: inv.additionalInfo || (data?.additionalInfo ?? null),
      computedTotal: calcTotalFromData(inv.invoiceData),
    };
  });

  const paymentModes = Array.from(
    new Set(paymentModeRows.map((r) => r.paymentMode).filter(Boolean) as string[])
  );

  const hasFilters = search || payment || mode || from;
  const start = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, totalCount);

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (payment) params.set("payment", payment);
    if (mode) params.set("mode", mode);
    if (from) params.set("from", from);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/dashboard/employee/tax-invoice/history?${qs}` : "/dashboard/employee/tax-invoice/history";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-8 pt-8 pb-6">
        <PageHeader
          title="Tax Invoice History"
          subtitle="View all generated tax invoices created by all users."
          actionLabel="Create New Invoice"
          actionHref="/dashboard/employee/tax-invoice"
        />
      </div>

      <div className="flex-1 px-8 pb-8">
        {totalCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">No tax invoices yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save an invoice from the tax invoice page and it will appear here.
            </p>
            <Link
              href="/dashboard/employee/tax-invoice"
              className="mt-5 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Create Tax Invoice
            </Link>
          </div>
        ) : (
          <>
            <Suspense>
              <InvoiceFilters
                paymentModes={paymentModes}
                total={totalCount}
                filtered={rows.length}
              />
            </Suspense>

            <div className="mb-4 flex justify-end gap-2">
              <ExportAllButton />
              <ExportButton
                rows={rows.map((r) => ({
                  taxInvoiceNo: r.taxInvoiceNo,
                  invoiceDate: r.invoiceDate.toISOString().split("T")[0],
                  placeOfSupply: r.placeOfSupply ?? null,
                  paymentMode: r.paymentMode ?? null,
                  totalAmount: r.computedTotal,
                  isPaid: r.isPaid,
                  additionalInfo: r.additionalInfo ?? null,
                }))}
              />
            </div>

            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <h2 className="text-lg font-semibold text-foreground">No invoices match your filters</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting or clearing the filters above.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-4">Invoice No.</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Created By</th>
                        <th className="px-5 py-4">Place of Supply</th>
                        <th className="px-5 py-4">Additional Info</th>
                        <th className="px-5 py-4">Payment Mode</th>
                        <th className="px-5 py-4">Total</th>
                        <th className="px-5 py-4">Saved</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Payment</th>
                        <th className="px-5 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className={`text-sm text-foreground hover:bg-muted/30 ${
                            hasFilters && !invoice.isPaid && payment === "unpaid"
                              ? "bg-red-50/30"
                              : ""
                          }`}
                        >
                          <td className="px-5 py-4 font-semibold">{invoice.taxInvoiceNo}</td>
                          <td className="px-5 py-4">{invoice.invoiceDate.toLocaleDateString("en-US")}</td>
                          <td className="px-5 py-4">{invoice.user.name}</td>
                          <td className="px-5 py-4">
                            {invoice.placeOfSupply ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                  <circle cx="12" cy="9" r="2.5" />
                                </svg>
                                {invoice.placeOfSupply}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {invoice.additionalInfo ? (
                              <span className="text-sm text-foreground whitespace-pre-wrap">{invoice.additionalInfo}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">{invoice.paymentMode || "—"}</td>
                          <td className="px-5 py-4 font-medium">{formatCurrency(invoice.computedTotal)}</td>
                          <td className="px-5 py-4 text-muted-foreground">{invoice.createdAt.toLocaleString("en-US")}</td>
                          <td className="px-5 py-4">
                            <StatusBadge label="Saved" variant="green" />
                          </td>
                          <td className="px-5 py-4">
                            <InvoicePaidToggle invoiceId={invoice.id} initialIsPaid={invoice.isPaid} />
                          </td>
                          <td className="px-5 py-4">
                            <InvoiceRowActions invoiceId={invoice.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <div className="rounded-xl border border-border bg-card px-6 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Amount including VAT
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Across {totalCount} invoice{totalCount !== 1 ? "s" : ""}
                  {hasFilters ? " (filtered)" : ""}
                </p>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>
                  Showing <span className="font-semibold text-foreground">{start}</span>-
                  <span className="font-semibold text-foreground">{end}</span> of{" "}
                  <span className="font-semibold text-foreground">{totalCount}</span> invoices
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={buildPageHref(Math.max(1, safePage - 1))}
                    className={`rounded-xl border border-border px-3 py-2 text-sm font-medium transition ${
                      safePage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
                    }`}
                  >
                    Previous
                  </Link>
                  <span className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <Link
                    href={buildPageHref(Math.min(totalPages, safePage + 1))}
                    className={`rounded-xl border border-border px-3 py-2 text-sm font-medium transition ${
                      safePage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"
                    }`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
