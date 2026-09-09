"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { InvoiceData, computeExVAT } from "@/lib/invoice-types";
import { getSession } from "@/lib/session";

export type TaxInvoiceActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

function normalizeInvoiceData(raw: unknown): InvoiceData | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Partial<InvoiceData>;
  const lineItems = Array.isArray(data.lineItems) ? data.lineItems : [];
  const extraSheets = Array.isArray(data.extraSheets) ? data.extraSheets : [];

  if (lineItems.length === 0) return null;

  return {
    invoiceDate: typeof data.invoiceDate === "string" ? data.invoiceDate : "",
    taxInvoiceNo: typeof data.taxInvoiceNo === "string" ? data.taxInvoiceNo : "",
    supplierTIN: typeof data.supplierTIN === "string" ? data.supplierTIN : "",
    supplierName: typeof data.supplierName === "string" ? data.supplierName : "",
    supplierAddress: typeof data.supplierAddress === "string" ? data.supplierAddress : "",
    supplierTel: typeof data.supplierTel === "string" ? data.supplierTel : "",
    purchaserTIN: typeof data.purchaserTIN === "string" ? data.purchaserTIN : "",
    purchaserName: typeof data.purchaserName === "string" ? data.purchaserName : "",
    purchaserAddress: typeof data.purchaserAddress === "string" ? data.purchaserAddress : "",
    purchaserTel: typeof data.purchaserTel === "string" ? data.purchaserTel : "",
    deliveryDate: typeof data.deliveryDate === "string" ? data.deliveryDate : "",
    placeOfSupply: typeof data.placeOfSupply === "string" ? data.placeOfSupply : "",
    additionalInfo: typeof data.additionalInfo === "string" ? data.additionalInfo : "",
    paymentMode: typeof data.paymentMode === "string" ? data.paymentMode : "",
    lineItems,
    extraSheets,
    commonPricing: typeof data.commonPricing === "boolean" ? data.commonPricing : false,
    commonUnitPrice: typeof data.commonUnitPrice === "number" ? data.commonUnitPrice : 0,
    commonAmount: typeof data.commonAmount === "number" ? data.commonAmount : 0,
  };
}

async function canManageInvoice(invoiceId: string, userId: string, role: string) {
  const invoice = await prisma.taxInvoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, userId: true },
  });

  if (!invoice) {
    return { allowed: false, exists: false } as const;
  }

  // History page is shared across authenticated users, so permit management for signed-in roles.
  const allowed = role === "ADMIN" || role === "MANAGER" || role === "EMPLOYEE" || invoice.userId === userId;
  return { allowed, exists: true } as const;
}

function calculateTotalAmount(invoiceData: InvoiceData): number {
  return computeExVAT(invoiceData) * 1.18;
}

export async function saveTaxInvoice(
  invoiceData: InvoiceData
): Promise<TaxInvoiceActionResult<{ id: string; taxInvoiceNo: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated." };
  }

  const taxInvoiceNo = invoiceData.taxInvoiceNo.trim();
  if (!taxInvoiceNo) {
    return { success: false, error: "Tax invoice number is required." };
  }

  const invoiceDate = new Date(invoiceData.invoiceDate);

  const invoicePayload = {
    invoiceDate,
    purchaserName: invoiceData.purchaserName.trim() || null,
    paymentMode: invoiceData.paymentMode.trim() || null,
    additionalInfo: invoiceData.additionalInfo.trim() || null,
    totalAmount: calculateTotalAmount(invoiceData),
    invoiceData: invoiceData as unknown as Prisma.InputJsonValue,
  };

  try {
    const existingInvoice = await prisma.taxInvoice.findFirst({
      where: {
        userId: session.userId,
        taxInvoiceNo,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    const savedInvoice = existingInvoice
      ? await prisma.taxInvoice.update({
          where: { id: existingInvoice.id },
          data: invoicePayload,
          select: {
            id: true,
            taxInvoiceNo: true,
          },
        })
      : await prisma.taxInvoice.create({
          data: {
            userId: session.userId,
            taxInvoiceNo,
            ...invoicePayload,
          },
          select: {
            id: true,
            taxInvoiceNo: true,
          },
        });

    return { success: true, data: savedInvoice };
  } catch {
    return { success: false, error: "Failed to save the tax invoice." };
  }
}

export async function toggleInvoicePaid(
  invoiceId: string,
  isPaid: boolean
): Promise<TaxInvoiceActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const permission = await canManageInvoice(invoiceId, session.userId, session.role);
  if (!permission.exists) return { success: false, error: "Invoice not found." };
  if (!permission.allowed) return { success: false, error: "Not authorized." };

  try {
    await prisma.taxInvoice.update({
      where: { id: invoiceId },
      data: { isPaid },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update payment status." };
  }
}

export async function getTaxInvoiceById(
  invoiceId: string
): Promise<TaxInvoiceActionResult<InvoiceData>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const permission = await canManageInvoice(invoiceId, session.userId, session.role);
  if (!permission.exists) return { success: false, error: "Invoice not found." };
  if (!permission.allowed) return { success: false, error: "Not authorized." };

  try {
    const invoice = await prisma.taxInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        taxInvoiceNo: true,
        invoiceDate: true,
        purchaserName: true,
        paymentMode: true,
        placeOfSupply: true,
        invoiceData: true,
      },
    });

    if (!invoice) return { success: false, error: "Invoice not found." };

    const normalized = normalizeInvoiceData(invoice.invoiceData);
    if (!normalized) {
      return { success: false, error: "Stored invoice format is invalid." };
    }

    return {
      success: true,
      data: {
        ...normalized,
        taxInvoiceNo: normalized.taxInvoiceNo || invoice.taxInvoiceNo,
        invoiceDate: normalized.invoiceDate || invoice.invoiceDate.toISOString().split("T")[0],
        purchaserName: normalized.purchaserName || invoice.purchaserName || "",
        paymentMode: normalized.paymentMode || invoice.paymentMode || "",
        placeOfSupply: normalized.placeOfSupply || invoice.placeOfSupply || "",
      },
    };
  } catch {
    return { success: false, error: "Failed to load invoice." };
  }
}

export async function updateTaxInvoiceById(
  invoiceId: string,
  invoiceData: InvoiceData
): Promise<TaxInvoiceActionResult<{ id: string; taxInvoiceNo: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const permission = await canManageInvoice(invoiceId, session.userId, session.role);
  if (!permission.exists) return { success: false, error: "Invoice not found." };
  if (!permission.allowed) return { success: false, error: "Not authorized." };

  const taxInvoiceNo = invoiceData.taxInvoiceNo.trim();
  if (!taxInvoiceNo) {
    return { success: false, error: "Tax invoice number is required." };
  }

  const parsedDate = new Date(invoiceData.invoiceDate);
  const isValidDate = !Number.isNaN(parsedDate.getTime());

  try {
    let invoiceDate: Date;
    if (isValidDate) {
      invoiceDate = parsedDate;
    } else {
      const existing = await prisma.taxInvoice.findUnique({
        where: { id: invoiceId },
        select: { invoiceDate: true },
      });
      invoiceDate = existing?.invoiceDate ?? new Date();
    }

    const invoicePayload = {
      taxInvoiceNo,
      invoiceDate,
      purchaserName: invoiceData.purchaserName.trim() || null,
      paymentMode: invoiceData.paymentMode.trim() || null,
      placeOfSupply: invoiceData.placeOfSupply.trim() || null,
      additionalInfo: invoiceData.additionalInfo.trim() || null,
      totalAmount: calculateTotalAmount(invoiceData),
      invoiceData: invoiceData as unknown as Prisma.InputJsonValue,
    };

    const updated = await prisma.taxInvoice.update({
      where: { id: invoiceId },
      data: invoicePayload,
      select: { id: true, taxInvoiceNo: true },
    });

    return { success: true, data: updated };
  } catch (err) {
    console.error("[updateTaxInvoiceById] error:", err);
    return { success: false, error: "Failed to update the tax invoice." };
  }
}

export async function deleteTaxInvoiceById(
  invoiceId: string
): Promise<TaxInvoiceActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const permission = await canManageInvoice(invoiceId, session.userId, session.role);
  if (!permission.exists) return { success: false, error: "Invoice not found." };
  if (!permission.allowed) return { success: false, error: "Not authorized." };

  try {
    await prisma.taxInvoice.delete({ where: { id: invoiceId } });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete the tax invoice." };
  }
}

export type ExportAllRow = {
  taxInvoiceNo: string;
  invoiceDate: string;
  purchaserName: string | null;
  placeOfSupply: string | null;
  paymentMode: string | null;
  totalAmount: number;
  isPaid: boolean;
  additionalInfo: string | null;
  createdBy: string;
  createdAt: string;
};

export async function getAllInvoicesForExport(): Promise<
  TaxInvoiceActionResult<ExportAllRow[]>
> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  try {
    const invoices = await prisma.taxInvoice.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        taxInvoiceNo: true,
        invoiceDate: true,
        purchaserName: true,
        placeOfSupply: true,
        paymentMode: true,
        totalAmount: true,
        isPaid: true,
        additionalInfo: true,
        invoiceData: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    const rows: ExportAllRow[] = invoices.map((inv) => {
      const data = inv.invoiceData as Partial<InvoiceData> | null;
      const computedTotal =
        computeExVAT({
          lineItems: data?.lineItems ?? [],
          extraSheets: data?.extraSheets ?? [],
          commonPricing: data?.commonPricing,
          commonAmount: data?.commonAmount,
        }) * 1.18;

      return {
        taxInvoiceNo: inv.taxInvoiceNo,
        invoiceDate: inv.invoiceDate.toISOString().split("T")[0],
        purchaserName: inv.purchaserName || (data?.purchaserName ?? null),
        placeOfSupply: inv.placeOfSupply || (data?.placeOfSupply ?? null),
        paymentMode: inv.paymentMode ?? null,
        totalAmount: computedTotal,
        isPaid: inv.isPaid,
        additionalInfo: inv.additionalInfo || (data?.additionalInfo ?? null),
        createdBy: inv.user?.name ?? "Unknown",
        createdAt: inv.createdAt.toISOString().replace("T", " ").slice(0, 19),
      };
    });

    return { success: true, data: rows };
  } catch {
    return { success: false, error: "Failed to fetch invoices for export." };
  }
}