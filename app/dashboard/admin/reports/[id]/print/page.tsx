import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import type { InvoiceData } from "@/lib/invoice-types";
import PrintInvoiceClient from "./PrintInvoiceClient";

export const metadata = { title: "Print Tax Invoice - Admin - Iruka Motors" };

export default async function AdminPrintTaxInvoicePage({
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
      invoiceData: true,
    },
  });

  if (!invoice) notFound();

  return <PrintInvoiceClient invoiceData={invoice.invoiceData as unknown as InvoiceData} />;
}
