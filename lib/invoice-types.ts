export interface LineItem {
  id: string;
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface ExtraSheet {
  id: string;
  lineItems: LineItem[];
}

export interface InvoiceData {
  invoiceDate: string;
  taxInvoiceNo: string;
  supplierTIN: string;
  supplierName: string;
  supplierAddress: string;
  supplierTel: string;
  purchaserTIN: string;
  purchaserName: string;
  purchaserAddress: string;
  purchaserTel: string;
  deliveryDate: string;
  placeOfSupply: string;
  additionalInfo: string;
  lineItems: LineItem[];
  paymentMode: string;
  extraSheets: ExtraSheet[];
  /** When true, a single Unit Price / Amount applies to the whole invoice instead of per line item. */
  commonPricing?: boolean;
  commonUnitPrice?: number;
  commonAmount?: number;
}

export const defaultInvoiceData: InvoiceData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  taxInvoiceNo: "",
  supplierTIN: "108995203",
  supplierName: "IRUKA MOTORS",
  supplierAddress: "NO: A/G/9, Sri Sangaraja Mawatha, Colombo - 10",
  supplierTel: "071-3283005 / 077-1603968",
  purchaserTIN: "",
  purchaserName: "",
  purchaserAddress: "",
  purchaserTel: "",
  deliveryDate: "",
  placeOfSupply: "",
  additionalInfo: "",
  lineItems: [
    { id: "1", reference: "", description: "", quantity: 0, unitPrice: 0 },
  ],
  paymentMode: "",
  extraSheets: [],
  commonPricing: false,
  commonUnitPrice: 0,
  commonAmount: 0,
};

/**
 * Total "Excl. VAT" value for an invoice (main page + all extra sheets combined).
 * When commonPricing is on, a single flat amount replaces the per-item sums.
 */
export function computeExVAT(
  data: Pick<InvoiceData, "lineItems" | "extraSheets" | "commonPricing" | "commonAmount">
): number {
  if (data.commonPricing) return data.commonAmount ?? 0;
  const mainEx = data.lineItems.reduce(
    (s, i) => s + (i.amount !== undefined ? i.amount : i.quantity * i.unitPrice),
    0
  );
  const extraEx = (data.extraSheets ?? []).reduce(
    (s, sheet) =>
      s + sheet.lineItems.reduce((ss, i) => ss + (i.amount !== undefined ? i.amount : i.quantity * i.unitPrice), 0),
    0
  );
  return mainEx + extraEx;
}

export function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    return ones[Math.floor(num / 100)] + " Hundred " + convert(num % 100);
  }

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  let result = "";

  if (intPart >= 10000000) {
    result += convert(Math.floor(intPart / 10000000)) + "Crore ";
    const rem = intPart % 10000000;
    if (rem >= 100000) result += convert(Math.floor(rem / 100000)) + "Lakh ";
    const rem2 = rem % 100000;
    if (rem2 >= 1000) result += convert(Math.floor(rem2 / 1000)) + "Thousand ";
    result += convert(rem2 % 1000);
  } else if (intPart >= 100000) {
    result += convert(Math.floor(intPart / 100000)) + "Lakh ";
    const rem = intPart % 100000;
    if (rem >= 1000) result += convert(Math.floor(rem / 1000)) + "Thousand ";
    result += convert(rem % 1000);
  } else if (intPart >= 1000) {
    result += convert(Math.floor(intPart / 1000)) + "Thousand ";
    result += convert(intPart % 1000);
  } else {
    result += convert(intPart);
  }

  result = result.trim() + " Rupees";
  if (decPart > 0) {
    result += " and " + convert(decPart).trim() + " Cents";
  }
  return result + " Only";
}
