"use client";

import { InvoiceData, ExtraSheet, numberToWords, computeExVAT } from "@/lib/invoice-types";
import { useEffect, useRef, useState } from "react";

interface Props {
  data: InvoiceData;
  autoGrowPages?: boolean;
}

// ── A4 page budget (px at 96 dpi) ─────────────────────────────────────
// All section heights are measured from the rendered CSS.
// Recalculate only when the letterhead or signature block changes.
const A4_PX  = 1123; // 297 mm × (96 / 25.4)
const DEFAULT_ROW_PX = 28;   // one item row (cell height 28 px + border) fallback

// Fixed px consumed on the FIRST page outside the items table.
// Recalibrated so the first page can actually hold 16 rows before breaking.
//   FullLetterhead …………………………………………………………… 130
//   body padding-top ………………………………………………………  12
//   "Invoice" label + margin ……………………………………………………  33
//   Date / Invoice No row ………………………………………………… 34
//   Supplier–Purchaser table (5 rows) …………………………………… 148
//   items-table header row ………………………………………………  26
//   3 totals rows (3 × 28 + borders) ……………………………………  90
//   Total-in-words + Mode-of-Payment rows ………………………………  60
//   SignatureBlock (80 padding + lines + footer) ……………………… 142
//   body padding-bottom ……………………………………………………   0
//   minimum flex-spacer …………………………………………………… 16
const FIRST_FIXED = 633;

// Fixed px on CONTINUATION pages (compact header, no invoice fields):
//   CompactHeader ………………………………………………………… 52
//   body padding-top (continuation) ………………………………………  28
//   items-table header row ………………………………………………  26
//   SignatureBlock ………………………………………………………… 142
//   body padding-bottom ……………………………………………………   0
//   minimum flex-spacer …………………………………………………… 16
const CONT_FIXED = 52+28+26+128+0+16; // 250 px

// Row caps: non-final pages can carry 16 items; the final page is kept to 14 so
// the totals and signature blocks still fit without forcing an earlier break.
const FIRST_PAGE_MAX = 16;
const CONT_PAGE_MAX  = 16;
const LAST_PAGE_MAX  = 14;

const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: "1px solid #8090b0",
  padding: "6px 8px",
  fontSize: "11px",
  fontFamily: "Arial, sans-serif",
  color: "#1a2540",
  ...extra,
});

const labelColor = "#606880";

const fmt = (n: number) =>
  n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${m}/${day}/${y}`;
};

/**
 * Smart pagination that respects actual rendered row heights.
 * Falls back to fixed height if measurements unavailable.
 */
function paginateByActualHeight<T extends { id: string }>(
  items: T[],
  firstPageBudgetPx: number,
  contPageBudgetPx: number,
  rowHeights: Map<string, number>,
  firstMaxItems: number,
  contMaxItems: number,
  lastMaxItems: number
): T[][] {
  if (!items.length) return [[]];
  
  const pages: T[][] = [];
  let currentPage: T[] = [];
  let currentPageHeight = 0;
  let isFirstPage = true;

  // Add a safety buffer to account for minor rendering/printing variances
  const SAFETY_BUFFER_PX = 10;

  for (const item of items) {
    const itemHeight = rowHeights.get(item.id) ?? DEFAULT_ROW_PX;
    const pageBudget = isFirstPage ? firstPageBudgetPx - SAFETY_BUFFER_PX : contPageBudgetPx - SAFETY_BUFFER_PX;
    const maxItems = isFirstPage ? firstMaxItems : contMaxItems;
    
    // Check if adding this item exceeds budget OR the maximum item count
    if (
      currentPage.length > 0 &&
      (currentPageHeight + itemHeight > pageBudget || currentPage.length >= maxItems)
    ) {
      // Current page is full — start a new one
      pages.push(currentPage);
      currentPage = [item];
      currentPageHeight = itemHeight;
      isFirstPage = false;
    } else {
      // Add item to current page
      currentPage.push(item);
      currentPageHeight += itemHeight;
    }
  }

  // Add final page
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length >= 2) {
    const lastPage = pages[pages.length - 1];
    const previousPage = pages[pages.length - 2];

    while (lastPage.length > lastMaxItems && previousPage.length < contMaxItems) {
      const movedItem = lastPage.shift();
      if (!movedItem) break;
      previousPage.push(movedItem);

      if (lastPage.length === 0) {
        pages.pop();
        break;
      }
    }
  }

  return pages.length ? pages : [[]];
}

/** Compact header for continuation pages */
function CompactHeader({
  invoiceNo,
  invoiceDate,
  label,
}: {
  invoiceNo: string;
  invoiceDate: string;
  label: string;
}) {
  return (
    <div style={{ borderBottom: "2px solid #b0b8d0", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", border: "1.5px solid #1e3a8a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e8f0fe,#c8d8f8)", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Wilro Wheel Alignment" style={{ width: "76%", height: "76%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "900", letterSpacing: "1px", fontFamily: "Arial Black, sans-serif" }}>
            <span style={{ color: "#f97316" }}>WILRO</span>&nbsp;
            <span style={{ color: "#1e3a8a" }}>WHEEL ALIGNMENT</span>
          </div>
          <div style={{ fontSize: "9px", color: labelColor }}>
            Invoice No: <strong style={{ color: "#1a2540" }}>{invoiceNo}</strong>
            &nbsp;|&nbsp; Date: <strong style={{ color: "#1a2540" }}>{fmtDate(invoiceDate)}</strong>
          </div>
        </div>
      </div>
      <div style={{ fontSize: "10px", color: labelColor, textAlign: "right" }}>
        <strong style={{ color: "#1a2540" }}>{label}</strong>
      </div>
    </div>
  );
}

/** Full letterhead block */
function FullLetterhead({ pageNumber, totalPages }: { pageNumber?: number; totalPages?: number }) {
  return (
    <div style={{ borderBottom: "2px solid #b0b8d0", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px 12px" }}>
        <div style={{ width: "78px", height: "78px", border: "2px solid #1e3a8a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "linear-gradient(135deg,#e8f0fe 0%,#c8d8f8 100%)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Wilro Wheel Alignment" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "900", letterSpacing: "2px", margin: 0, fontFamily: "Arial Black, sans-serif", textAlign: "center", lineHeight: 1 }}>
            <span style={{ color: "#f97316" }}>WILRO</span>
            <span style={{ color: "#b0b8d0" }}>&nbsp;&nbsp;</span>
            <span style={{ color: "#1e3a8a" }}>WHEEL ALIGNMENT</span>
          </h1>
          <div style={{ height: "1px", background: "#d0d8ec", width: "100%" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px 0", fontSize: "11px", color: "#3a4560" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> 405, Colombo Road</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> Bandiyamulla</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> Gampaha</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>📞</span> 077 283 0826</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>📞</span> 033 223 9257</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>✉</span> wilroenter8@gmail.com</span>
          </div>
        </div>
      </div>
      <div style={{ background: "#e8eef8", padding: "5px 20px", fontSize: "9.5px", color: "#3a4560", textTransform: "uppercase", letterSpacing: "1px", borderTop: "1px solid #d0d8ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Precision Wheel Alignment, Balancing &amp; Automotive Care Services</span>
        {pageNumber !== undefined && totalPages !== undefined && (
          <span style={{ fontWeight: "700", color: "#1a2540", whiteSpace: "nowrap", marginLeft: "16px", textTransform: "none", letterSpacing: "0.5px" }}>
            Page {pageNumber} of {totalPages}
          </span>
        )}
      </div>
    </div>
  );
}

/** One A4 invoice-page div */
function InvoicePage({
  children,
  shadow = true,
  autoGrow = false,
}: {
  children: React.ReactNode;
  shadow?: boolean;
  autoGrow?: boolean;
}) {
  return (
    <div
      className="invoice-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        height: autoGrow ? "auto" : "297mm",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        overflow: autoGrow ? "visible" : "hidden",
        background: "white",
        boxShadow: shadow ? "0 2px 12px rgba(0,0,0,0.12)" : "none",
        position: "relative",
        isolation: "isolate",
      }}
    >
      {/* Company logo watermark — the real logo artwork, undistorted, centered faintly behind the content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          style={{ width: "340px", height: "auto", opacity: 0.08 }}
        />
      </div>
      {children}
    </div>
  );
}


/** Signature block — shown on every page */
function SignatureBlock() {
  return (
    <div style={{ paddingTop: "84px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", padding: "0 24px" }}>
        {["Authorized Signature (Supplier)", "Authorized Signature (Purchaser)"].map((label) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #8090b0", paddingTop: "5px", fontSize: "10px", color: labelColor }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "4px", paddingTop: "2px", borderTop: "1px solid #c0cce0", padding: "2px 20px 0" }}>
        <p style={{ fontSize: "8.5px", color: "#8090b0", letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
          This is a computer-generated tax invoice — Wilro Wheel Alignment, Bandiyamulla, Gampaha — wilroenter8@gmail.com
        </p>
      </div>
    </div>
  );
}

/** Items table (shared between main invoice and extra sheets) */
function ItemsTable({
  items,
  fillerCount,
  rowRefs,
  commonPricing,
}: {
  items: { id: string; reference: string; description: string; quantity: number; unitPrice: number; amount?: number }[];
  fillerCount: number;
  rowRefs?: React.MutableRefObject<Map<string, HTMLTableRowElement | null>>;
  /** When set, Unit Price / Amount are shown as one merged value instead of per row. */
  commonPricing?: { unitPrice: number; amount: number; showMerged: boolean };
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#e8eef8" }}>
          <th style={cell({ textAlign: "left",   fontWeight: "600", width: "8%"  })}>Reference</th>
          <th style={cell({ textAlign: "left",   fontWeight: "600", width: "42%" })}>Description of Goods or Services</th>
          <th style={cell({ textAlign: "center", fontWeight: "600", width: "9%"  })}>Quantity</th>
          <th style={cell({ textAlign: "right",  fontWeight: "600", width: "13%" })}>Unit Price</th>
          <th style={cell({ textAlign: "right",  fontWeight: "600", width: "17%" })}>Amount Excl. VAT (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr
            key={item.id}
            ref={(el) => {
              if (rowRefs && el) {
                rowRefs.current.set(item.id, el);
              }
            }}
          >
            <td style={cell({ height: "28px" })}>{item.reference}</td>
            <td style={cell({ height: "28px" })}>{item.description}</td>
            <td style={cell({ textAlign: "center", height: "28px" })}>{item.quantity}</td>
            {!commonPricing && (
              <>
                <td style={cell({ textAlign: "right",  height: "28px" })}>{fmt(item.unitPrice)}</td>
                <td style={cell({ textAlign: "right",  height: "28px" })}>{fmt(item.amount !== undefined ? item.amount : item.quantity * item.unitPrice)}</td>
              </>
            )}
            {commonPricing && commonPricing.showMerged && idx === 0 && (
              <>
                <td rowSpan={items.length} style={cell({ textAlign: "right", verticalAlign: "middle" })}>{fmt(commonPricing.unitPrice)}</td>
                <td rowSpan={items.length} style={cell({ textAlign: "right", verticalAlign: "middle" })}>{fmt(commonPricing.amount)}</td>
              </>
            )}
            {commonPricing && !commonPricing.showMerged && (
              <>
                <td style={cell({ height: "28px" })} />
                <td style={cell({ height: "28px" })} />
              </>
            )}
          </tr>
        ))}
        {Array.from({ length: Math.max(0, fillerCount) }).map((_, i) => (
          <tr key={`fill-${i}`}>
            <td style={cell({ height: "28px" })} />
            <td style={cell({ height: "28px" })} />
            <td style={cell({ height: "28px" })} />
            <td style={cell({ height: "28px" })} />
            <td style={cell({ height: "28px" })} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Render an ExtraSheet as one or more invoice pages.
 * Totals (Value of Supply, VAT, Grand) are shown ONLY on the last page of the
 * last sheet, using the combined grand total across ALL sheets.
 * Every page shows the Authorized Signature block.
 */
function ExtraSheetPages({
  sheet,
  sheetNumber,
  data,
  isLastSheet,
  combinedExVAT,
  combinedVAT,
  combinedGrand,
  autoGrowPages = false,
  rowHeights,
  startPage,
  grandTotalPages,
}: {
  sheet: ExtraSheet;
  sheetNumber: number;
  data: InvoiceData;
  isLastSheet: boolean;
  combinedExVAT: number;
  combinedVAT: number;
  combinedGrand: number;
  autoGrowPages?: boolean;
  rowHeights: Map<string, number>;
  startPage: number;
  grandTotalPages: number;
}) {
  // In preview (autoGrow) mode, never paginate — one auto-growing page per sheet.
  // In print mode, smart paginate to fit A4 pages based on heights.
  const pages = autoGrowPages
    ? [sheet.lineItems]
    : paginateByActualHeight(
        sheet.lineItems,
        A4_PX - FIRST_FIXED,
        A4_PX - CONT_FIXED,
        rowHeights,
        FIRST_PAGE_MAX,
        CONT_PAGE_MAX,
        LAST_PAGE_MAX
      );
  const total = pages.length;
      const shiftUpForLongInvoice = total > 2;

  return (
    <>
      {pages.map((pageItems, pageIdx) => {
        const isFirst     = pageIdx === 0;
        const isLast      = pageIdx === total - 1;
        const isVeryLast  = isLast && isLastSheet;
        const fillerCount = autoGrowPages ? 0 : 0; // Smart pagination dynamically fills pages, no fixed fillers used by default.

        return (
          <InvoicePage key={pageIdx} autoGrow={autoGrowPages}>

            {/* Full letterhead on the first page of each sheet; compact on continuation pages */}
            {isFirst ? (
              <FullLetterhead
                pageNumber={grandTotalPages > 1 ? startPage + pageIdx : undefined}
                totalPages={grandTotalPages > 1 ? grandTotalPages : undefined}
              />
            ) : (
              <CompactHeader
                invoiceNo={data.taxInvoiceNo}
                invoiceDate={data.invoiceDate}
                label={`Sheet ${sheetNumber} — Page ${startPage + pageIdx} of ${grandTotalPages}`}
              />
            )}

            {/* Body */}
            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", padding: isFirst ? "12px 20px 4px" : shiftUpForLongInvoice ? "10px 20px 0" : "24px 20px 2px", overflow: "hidden" }}>

              <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

                {/* Invoice header fields — first page of this sheet only */}
                {isFirst && (
                  <>
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                      <span style={{ border: "1px solid #2a3560", padding: "3px 28px", fontSize: "12px", fontWeight: "600", color: "#1a2540", letterSpacing: "1px" }}>
                        Invoice
                      </span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={cell({ width: "50%" })}><span style={{ color: labelColor }}>Date of Invoice: </span><strong>{fmtDate(data.invoiceDate)}</strong></td>
                          <td style={cell()}><span style={{ color: labelColor }}>Invoice No.: </span><strong>{data.taxInvoiceNo}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={cell({ width: "50%", verticalAlign: "top" })}>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Suppliers TIN: </span><strong>{data.supplierTIN}</strong></div>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Supplier s Name: </span><strong>{data.supplierName}</strong></div>
                            <div><span style={{ color: labelColor }}>Address: </span><strong>{data.supplierAddress}</strong></div>
                          </td>
                          <td style={cell({ verticalAlign: "top" })}>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Purchaser s TIN: </span><strong>{data.purchaserTIN}</strong></div>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Purchaser s Name: </span><strong>{data.purchaserName}</strong></div>
                            <div><span style={{ color: labelColor }}>Address: </span><strong>{data.purchaserAddress}</strong></div>
                          </td>
                        </tr>
                        <tr>
                          <td style={cell()}><span style={{ color: labelColor }}>Telephone No.: </span><strong>{data.supplierTel}</strong></td>
                          <td style={cell()}><span style={{ color: labelColor }}>Telephone No.: </span><strong>{data.purchaserTel}</strong></td>
                        </tr>
                        <tr>
                          <td style={cell()}><span style={{ color: labelColor }}>Date of Delivery: </span><strong>{fmtDate(data.deliveryDate)}</strong></td>
                          <td style={cell()}><span style={{ color: labelColor }}>Place of Supply: </span><strong>{data.placeOfSupply}</strong></td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={cell({ minHeight: "28px" })}><span style={{ color: labelColor }}>Additional Information if any: </span><span>{data.additionalInfo}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* Items */}
                <ItemsTable
                  items={pageItems}
                  fillerCount={fillerCount}
                  commonPricing={data.commonPricing ? { unitPrice: data.commonUnitPrice ?? 0, amount: data.commonAmount ?? 0, showMerged: isFirst } : undefined}
                />

                {!isLast && (
                  <div style={{ marginTop: "6px", textAlign: "right", fontSize: "9px", color: "#8090b0", fontStyle: "italic" }}>
                    Sheet {sheetNumber} continued on page {pageIdx + 2}…
                  </div>
                )}

                {/* Spacer — keep totals lower on continuation pages, but lift them on the final page */}
                <div style={{ flex: isVeryLast ? 0 : 1, minHeight: isVeryLast ? "32px" : "16px" }} />

                {/* Totals — pinned to the bottom, only on the very last page of the very last sheet */}
                {isVeryLast && (
                  <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td colSpan={3} style={cell({ color: labelColor, height: "28px" })}>Total Value of Supply:</td>
                          <td style={cell({ height: "28px" })} />
                          <td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(combinedExVAT)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} style={cell({ color: labelColor, height: "28px" })}>VAT Amount (Total Value of Supply @ 18%)</td>
                          <td style={cell({ height: "28px" })} />
                          <td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(combinedVAT)}</td>
                        </tr>
                        <tr style={{ background: "#e8eef8" }}>
                          <td colSpan={3} style={cell({ fontWeight: "600", height: "28px" })}>Total Amount including VAT:</td>
                          <td style={cell({ height: "28px" })} />
                          <td style={cell({ textAlign: "right", fontWeight: "700", fontSize: "12px", height: "28px" })}>{fmt(combinedGrand)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={cell({ height: "28px" })}>
                            <span style={{ color: labelColor }}>Total Amount in words: </span>
                            <span style={{ color: "#1a2540", marginLeft: "6px", fontStyle: "italic" }}>{combinedGrand > 0 ? numberToWords(combinedGrand) : ""}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={cell({ height: "28px" })}>
                            <span style={{ color: labelColor }}>Mode of Payment: </span>
                            <strong style={{ color: "#1a2540", marginLeft: "6px" }}>{data.paymentMode}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                <SignatureBlock />
              </div>
            </div>
          </InvoicePage>
        );
      })}
    </>
  );
}

export default function InvoicePreview({ data, autoGrowPages = false }: Props) {
  const [rowHeights, setRowHeights] = useState<Map<string, number>>(new Map());
  const [isMeasured, setIsMeasured] = useState(false);
  const measurementRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  const extraSheets  = data.extraSheets ?? [];
  const hasExtra     = extraSheets.length > 0;

  // Combined totals across ALL sheets (main + all extra); a single flat amount when commonPricing is on.
  const combinedExVAT = computeExVAT(data);
  const combinedVAT   = combinedExVAT * 0.18;
  const combinedGrand = combinedExVAT + combinedVAT;

  // Phase 1: Measure actual row heights dynamically
  useEffect(() => {
    if (autoGrowPages || isMeasured) return;

    const timeout = setTimeout(() => {
      const heights = new Map<string, number>();
      measurementRefs.current.forEach((element, itemId) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          heights.set(itemId, Math.ceil(rect.height));
        }
      });

      if (heights.size > 0) {
        setRowHeights(heights);
        setIsMeasured(true);
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [autoGrowPages, isMeasured]);

  // Phase 2: React uses heights to calculate the chunks
  // In print mode, paginate intelligently using the actual heights.
  const pages = autoGrowPages || !isMeasured
    ? [data.lineItems]
    : paginateByActualHeight(
        data.lineItems,
        A4_PX - FIRST_FIXED,
        A4_PX - CONT_FIXED,
        rowHeights,
        FIRST_PAGE_MAX,
        CONT_PAGE_MAX,
        LAST_PAGE_MAX
      );
  const totalPages = pages.length;

  // Global page counts across all sheets for correct "Page X of Y" numbering
  const extraSheetPageCounts = (autoGrowPages || !isMeasured)
    ? extraSheets.map(() => 1)
    : extraSheets.map(sheet =>
        paginateByActualHeight(
          sheet.lineItems,
          A4_PX - FIRST_FIXED,
          A4_PX - CONT_FIXED,
          rowHeights,
          FIRST_PAGE_MAX,
          CONT_PAGE_MAX,
          LAST_PAGE_MAX
        ).length
      );

  const grandTotalPages = totalPages + extraSheetPageCounts.reduce((a, b) => a + b, 0);

  // 1-based start page for each extra sheet
  const extraSheetStartPages: number[] = [];
  let cumulativePage = totalPages;
  for (const count of extraSheetPageCounts) {
    extraSheetStartPages.push(cumulativePage + 1);
    cumulativePage += count;
  }

  return (
    <div id="invoice-preview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Hidden measurement container — rendered off-screen to measure individual row heights */}
      {!isMeasured && !autoGrowPages && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", visibility: "hidden" }}>
          <ItemsTable
            items={[
              ...data.lineItems,
              ...extraSheets.flatMap(s => s.lineItems)
            ]}
            fillerCount={0}
            rowRefs={measurementRefs}
          />
        </div>
      )}

      {/* ══ MAIN INVOICE PAGES ══════════════════════════════ */}
      {pages.map((pageItems, pageIdx) => {
        const isFirst    = pageIdx === 0;
        const isLast     = pageIdx === totalPages - 1;
        // Totals only appear here when there are NO extra sheets
        const showTotals  = isLast && !hasExtra;
        const fillerCount = autoGrowPages ? 0 : 0; // Handled by dynamic pagination without fixed fillers

        return (
          <InvoicePage key={pageIdx} autoGrow={autoGrowPages}>

            {/* Letterhead */}
            {isFirst ? (
              <FullLetterhead
                pageNumber={grandTotalPages > 1 ? pageIdx + 1 : undefined}
                totalPages={grandTotalPages > 1 ? grandTotalPages : undefined}
              />
            ) : (
              <CompactHeader
                invoiceNo={data.taxInvoiceNo}
                invoiceDate={data.invoiceDate}
                label={`Page ${pageIdx + 1} of ${grandTotalPages}${hasExtra ? ` · ${extraSheets.length} additional sheet${extraSheets.length > 1 ? "s" : ""}` : ""}`}
              />
            )}

            {/* Body */}
            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", padding: isFirst ? "12px 20px 4px" : hasExtra && totalPages > 2 ? "10px 20px 0" : "24px 20px 2px", overflow: "hidden" }}>

              <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

                {/* First-page header info */}
                {isFirst && (
                  <>
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                      <span style={{ border: "1px solid #2a3560", padding: "3px 28px", fontSize: "12px", fontWeight: "600", color: "#1a2540", letterSpacing: "1px" }}>
                        Invoice
                      </span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={cell({ width: "50%" })}><span style={{ color: labelColor }}>Date of Invoice: </span><strong>{fmtDate(data.invoiceDate)}</strong></td>
                          <td style={cell()}><span style={{ color: labelColor }}>Invoice No.: </span><strong>{data.taxInvoiceNo}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={cell({ width: "50%", verticalAlign: "top" })}>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Suppliers TIN: </span><strong>{data.supplierTIN}</strong></div>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Supplier s Name: </span><strong>{data.supplierName}</strong></div>
                            <div><span style={{ color: labelColor }}>Address: </span><strong>{data.supplierAddress}</strong></div>
                          </td>
                          <td style={cell({ verticalAlign: "top" })}>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Purchaser s TIN: </span><strong>{data.purchaserTIN}</strong></div>
                            <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Purchaser s Name: </span><strong>{data.purchaserName}</strong></div>
                            <div><span style={{ color: labelColor }}>Address: </span><strong>{data.purchaserAddress}</strong></div>
                          </td>
                        </tr>
                        <tr>
                          <td style={cell()}><span style={{ color: labelColor }}>Telephone No.: </span><strong>{data.supplierTel}</strong></td>
                          <td style={cell()}><span style={{ color: labelColor }}>Telephone No.: </span><strong>{data.purchaserTel}</strong></td>
                        </tr>
                        <tr>
                          <td style={cell()}><span style={{ color: labelColor }}>Date of Delivery: </span><strong>{fmtDate(data.deliveryDate)}</strong></td>
                          <td style={cell()}><span style={{ color: labelColor }}>Place of Supply: </span><strong>{data.placeOfSupply}</strong></td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={cell({ minHeight: "28px" })}><span style={{ color: labelColor }}>Additional Information if any: </span><span>{data.additionalInfo}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* Items */}
                <ItemsTable
                  items={pageItems}
                  fillerCount={fillerCount}
                  commonPricing={data.commonPricing ? { unitPrice: data.commonUnitPrice ?? 0, amount: data.commonAmount ?? 0, showMerged: isFirst } : undefined}
                />

                {!isLast && (
                  <div style={{ marginTop: "6px", textAlign: "right", fontSize: "9px", color: "#8090b0", fontStyle: "italic" }}>
                    Continued on page {pageIdx + 2}…
                  </div>
                )}

                {/* Spacer — keep totals lower on continuation pages, but lift them on the final page */}
                <div style={{ flex: showTotals ? 0 : 1, minHeight: showTotals ? "32px" : "16px" }} />

                {/* Totals — pinned to the bottom, only on last page when no extra sheets */}
                {showTotals && (
                  <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td colSpan={3} style={cell({ color: labelColor, height: "28px" })}>Total Value of Supply:</td>
                          <td style={cell({ height: "28px" })} />
                          <td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(combinedExVAT)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} style={cell({ color: labelColor, height: "28px" })}>VAT Amount (Total Value of Supply @ 18%)</td>
                          <td style={cell({ height: "28px" })} />
                          <td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(combinedVAT)}</td>
                        </tr>
                        <tr style={{ background: "#e8eef8" }}>
                          <td colSpan={3} style={cell({ fontWeight: "600", height: "28px" })}>Total Amount including VAT:</td>
                          <td style={cell({ height: "28px" })} />
                          <td style={cell({ textAlign: "right", fontWeight: "700", fontSize: "12px", height: "28px" })}>{fmt(combinedGrand)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={cell({ height: "28px" })}>
                            <span style={{ color: labelColor }}>Total Amount in words: </span>
                            <span style={{ color: "#1a2540", marginLeft: "6px", fontStyle: "italic" }}>{combinedGrand > 0 ? numberToWords(combinedGrand) : ""}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={cell({ height: "28px" })}>
                            <span style={{ color: labelColor }}>Mode of Payment: </span>
                            <strong style={{ color: "#1a2540", marginLeft: "6px" }}>{data.paymentMode}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                <SignatureBlock />
              </div>
            </div>
          </InvoicePage>
        );
      })}

      {/* ══ EXTRA SHEETS ════════════════════════════════════ */}
      {extraSheets.map((sheet, idx) => (
        <ExtraSheetPages
          key={sheet.id}
          sheet={sheet}
          sheetNumber={idx + 2}
          data={data}
          isLastSheet={idx === extraSheets.length - 1}
          combinedExVAT={combinedExVAT}
          combinedVAT={combinedVAT}
          combinedGrand={combinedGrand}
          autoGrowPages={autoGrowPages}
          rowHeights={rowHeights}
          startPage={extraSheetStartPages[idx]}
          grandTotalPages={grandTotalPages}
        />
      ))}
    </div>
  );
}
