"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { InvoiceData, LineItem, ExtraSheet, numberToWords, computeExVAT } from "@/lib/invoice-types";
import { v4 as uuidv4 } from "uuid";

/** Textarea that auto-expands vertically to fit its content — no scroll bar. */
function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{
        border: "none",
        outline: "none",
        background: "transparent",
        width: "100%",
        fontSize: "11px",
        fontFamily: "Arial, sans-serif",
        color: "#1a2540",
        fontWeight: 600,
        padding: 0,
        margin: 0,
        resize: "none",
        overflow: "hidden",
        lineHeight: "1.45",
        display: "block",
      }}
    />
  );
}

interface Props {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  errors?: unknown;
}


// Regular pages can hold 16 lines; the final summary page stays capped at 14.
const SUMMARY_PAGE_MAX_LINES = 14;
const NON_SUMMARY_PAGE_MAX_LINES = 16;

const labelColor = "#606880";

const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: "1px solid #8090b0",
  padding: "6px 8px",
  fontSize: "11px",
  fontFamily: "Arial, sans-serif",
  color: "#1a2540",
  ...extra,
});

const inpStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  fontSize: "11px",
  fontFamily: "Arial, sans-serif",
  color: "#1a2540",
  fontWeight: 600,
  padding: 0,
};

const readonlyStyle: React.CSSProperties = {
  ...inpStyle,
  color: "#1a2540",
  fontWeight: 600,
  cursor: "default",
};

const floatingDeleteButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: "6px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "1px solid #fca5a5",
  background: "#fff1f2",
  color: "#b91c1c",
  fontSize: "12px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
};

const fmt = (n: number) =>
  n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

/** Full A4 letterhead — same as first page */
function FullLetterhead() {
  return (
    <div style={{ borderBottom: "2px solid #b0b8d0", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px 12px" }}>
        <div style={{ width: "78px", height: "78px", border: "2px solid #1e3a8a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "linear-gradient(135deg, #e8f0fe 0%, #c8d8f8 100%)" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px 0", fontSize: "11px", color: "#3a4560", fontFamily: "Arial, sans-serif" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> 405, Colombo Road</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> Bandiyamulla</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> Gampaha</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>📞</span> 077 283 0826</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>📞</span> 033 223 9257</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>✉</span> wilroenter8@gmail.com</span>
          </div>
        </div>
      </div>
      <div style={{ background: "#e8eef8", padding: "5px 20px", fontSize: "9.5px", color: "#3a4560", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", fontFamily: "Arial, sans-serif", borderTop: "1px solid #d0d8ec" }}>
        Precision Wheel Alignment, Balancing &amp; Automotive Care Services
      </div>
    </div>
  );
}


export default function InvoiceForm({ data, onChange }: Props) {
  const [rawPrices, setRawPrices] = useState<Record<string, string>>({});
  const [rawAmounts, setRawAmounts] = useState<Record<string, string>>({});
  const [rawCommonPrice, setRawCommonPrice] = useState<string | null>(null);
  const [rawCommonAmount, setRawCommonAmount] = useState<string | null>(null);

  const update = (field: keyof InvoiceData, value: string) =>
    onChange({ ...data, [field]: value });

  const toggleCommonPricing = (checked: boolean) =>
    onChange({ ...data, commonPricing: checked });

  const handleCommonPriceChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const intPart = normalizeLeadingZeros(parts[0] ?? "");
    const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;
    const norm = decPart !== undefined ? `${intPart || "0"}.${decPart}` : intPart;
    setRawCommonPrice(norm);
    onChange({ ...data, commonUnitPrice: parseFloat(norm || "0") || 0 });
  };
  const commitRawCommonPrice = () => setRawCommonPrice(null);

  const handleCommonAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const intPart = normalizeLeadingZeros(parts[0] ?? "");
    const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;
    const norm = decPart !== undefined ? `${intPart || "0"}.${decPart}` : intPart;
    setRawCommonAmount(norm);
    onChange({ ...data, commonAmount: parseFloat(norm || "0") || 0 });
  };
  const commitRawCommonAmount = () => setRawCommonAmount(null);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    onChange({
      ...data,
      lineItems: data.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });

  const addItem = () => {
    if (data.lineItems.length >= mainPageMaxLines) return;
    onChange({
      ...data,
      lineItems: [
        ...data.lineItems,
        { id: uuidv4(), reference: "", description: "", quantity: 0, unitPrice: 0 },
      ],
    });
  };

  const removeItem = (id: string) => {
    if (data.lineItems.length === 1) return;
    onChange({ ...data, lineItems: data.lineItems.filter((i) => i.id !== id) });
  };

  const normalizeLeadingZeros = (raw: string) => raw.replace(/^0+(?=\d)/, "");

  const handleQuantityChange = (id: string, raw: string) => {
    const d = raw.replace(/\D/g, "");
    const qty = parseInt(normalizeLeadingZeros(d) || "0", 10) || 0;
    onChange({
      ...data,
      lineItems: data.lineItems.map((item) =>
        item.id === id ? { ...item, quantity: qty, amount: undefined } : item
      ),
    });
  };

  const handleUnitPriceChange = (id: string, raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const intPart = normalizeLeadingZeros(parts[0] ?? "");
    const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;
    const norm = decPart !== undefined ? `${intPart || "0"}.${decPart}` : intPart;
    setRawPrices((prev) => ({ ...prev, [id]: norm }));
    onChange({
      ...data,
      lineItems: data.lineItems.map((item) =>
        item.id === id ? { ...item, unitPrice: parseFloat(norm || "0") || 0, amount: undefined } : item
      ),
    });
  };

  const commitRawPrice = (id: string) => {
    setRawPrices((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleAmountChange = (id: string, raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const intPart = normalizeLeadingZeros(parts[0] ?? "");
    const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;
    const norm = decPart !== undefined ? `${intPart || "0"}.${decPart}` : intPart;
    setRawAmounts((prev) => ({ ...prev, [id]: norm }));
    const item = data.lineItems.find((i) => i.id === id);
    const qty = item?.quantity ?? 0;
    const amount = parseFloat(norm || "0") || 0;
    if (qty > 0) {
      const calcPrice = Math.round((amount / qty) * 100) / 100;
      setRawPrices((prev) => { const n = { ...prev }; delete n[id]; return n; });
      onChange({
        ...data,
        lineItems: data.lineItems.map((i) =>
          i.id === id ? { ...i, unitPrice: calcPrice, amount } : i
        ),
      });
    }
  };

  const commitRawAmount = (id: string) => {
    setRawAmounts((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  // Estimate how many visual lines each description occupies (~41 chars/line in the desc column)
  const estimateLines = (desc: string) => desc ? Math.ceil(desc.length / 41) : 1;
  const usedLines = data.lineItems.reduce((s, item) => s + estimateLines(item.description), 0);

  const hasExtraSheets = data.extraSheets.length > 0;
  const mainPageMaxLines = 16;
  const fillerCount = Math.max(0, mainPageMaxLines - usedLines);
  const totalExVAT  = computeExVAT(data);
  const vatAmount   = totalExVAT * 0.18;
  const totalIncVAT = totalExVAT + vatAmount;

  return (
    <>
      <div
        className="bg-white shadow-lg mx-auto"
        style={{
          width: "210mm",
          height: "297mm",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
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
          <img src="/logo.png" alt="" style={{ width: "340px", height: "auto", opacity: 0.08 }} />
        </div>

        <FullLetterhead />

        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", padding: "12px 20px 14px", overflow: "hidden" }}>

          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>

            {/* Header fields */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <span style={{ border: "1px solid #2a3560", padding: "3px 28px", fontSize: "12px", fontWeight: "600", color: "#1a2540", letterSpacing: "1px" }}>Invoice</span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={cell({ width: "50%" })}>
                    <span style={{ color: labelColor }}>Date of Invoice: </span>
                    <input type="date" value={data.invoiceDate} onChange={(e) => update("invoiceDate", e.target.value)} style={{ ...inpStyle, width: "auto" }} title="Date of Invoice" />
                    {data.invoiceDate && <span style={{ color: "#1a2540", fontWeight: 600, marginLeft: "4px" }}>({formatDate(data.invoiceDate)})</span>}
                  </td>
                  <td style={cell()}>
                    <span style={{ color: labelColor }}>Invoice No.: </span>
                    <input type="text" value={data.taxInvoiceNo} onChange={(e) => update("taxInvoiceNo", e.target.value)} placeholder="e.g. INV-2024-001" style={{ ...inpStyle, width: "auto", minWidth: "170px" }} title="Invoice No." />
                  </td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={cell({ width: "50%", verticalAlign: "top" })}>
                    <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Suppliers TIN: </span><span style={readonlyStyle}>{data.supplierTIN}</span></div>
                    <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Supplier s Name: </span><span style={readonlyStyle}>{data.supplierName}</span></div>
                    <div><span style={{ color: labelColor }}>Address: </span><span style={readonlyStyle}>{data.supplierAddress}</span></div>
                  </td>
                  <td style={cell({ verticalAlign: "top" })}>
                    <div style={{ marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Purchaser s TIN: </span>
                      <input type="text" value={data.purchaserTIN} onChange={(e) => update("purchaserTIN", e.target.value)} placeholder="TIN" style={inpStyle} />
                    </div>
                    <div style={{ marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Purchaser s Name: </span>
                      <input type="text" value={data.purchaserName} onChange={(e) => update("purchaserName", e.target.value)} placeholder="Name" style={inpStyle} />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
                      <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Address: </span>
                      <input type="text" value={data.purchaserAddress} onChange={(e) => update("purchaserAddress", e.target.value)} placeholder="Full address" style={inpStyle} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={cell()}><span style={{ color: labelColor }}>Telephone No.: </span><span style={readonlyStyle}>{data.supplierTel}</span></td>
                  <td style={cell()}>
                    <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Telephone No.: </span>
                    <input type="text" value={data.purchaserTel} onChange={(e) => update("purchaserTel", e.target.value)} placeholder="Contact number" style={inpStyle} />
                  </td>
                </tr>
                <tr>
                  <td style={cell()}>
                    <span style={{ color: labelColor }}>Date of Delivery: </span>
                    <input type="date" value={data.deliveryDate} onChange={(e) => update("deliveryDate", e.target.value)} style={{ ...inpStyle, width: "auto" }} />
                    {data.deliveryDate && <span style={{ color: "#1a2540", fontWeight: 600, marginLeft: "4px" }}>({formatDate(data.deliveryDate)})</span>}
                  </td>
                  <td style={cell()}>
                    <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Place of Supply: </span>
                    <input type="text" list="pos-list-main" value={data.placeOfSupply} onChange={(e) => update("placeOfSupply", e.target.value)} placeholder="Type or select..." style={inpStyle} />
                    <datalist id="pos-list-main">
                      {["MINNERIYA","PANAGODA","MULATIVE","DIYATHAWALA","MORGAN ROAD","JAFFNA","SALIYAPURA","SALIYAPURA SANNADDA","UDAWALAWA","KOSGAMA","DEME","MINNERIYA (2)","KILINOCHCHIYA","KATUBEDDA","OTHER"].map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={cell({ minHeight: "28px" })}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Additional Information if any: </span>
                      <input type="text" value={data.additionalInfo} onChange={(e) => update("additionalInfo", e.target.value)} placeholder="Note" style={{ ...inpStyle, flex: 1, minWidth: 0 }} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Common pricing toggle */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
              <label style={{ fontSize: "10.5px", color: labelColor, display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                <input type="checkbox" checked={!!data.commonPricing} onChange={(e) => toggleCommonPricing(e.target.checked)} />
                Use one common Unit Price / Amount for all items
              </label>
            </div>

            {/* Line Items table — all items, no pagination */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#e8eef8" }}>
                  <th style={cell({ textAlign: "left",   fontWeight: "600", width: "8%"  })}>Reference</th>
                  <th style={cell({ textAlign: "left",   fontWeight: "600", width: "48%" })}>Description of Goods or Services</th>
                  <th style={cell({ textAlign: "center", fontWeight: "600", width: "9%"  })}>Quantity</th>
                  <th style={cell({ textAlign: "right",  fontWeight: "600", width: "13%" })}>Unit Price</th>
                  <th style={cell({ textAlign: "right",  fontWeight: "600", width: "17.5%" })}>Amount Excl. VAT (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={cell({ padding: "0 8px", height: "28px", verticalAlign: "top" })}>
                      <div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center" }}>
                        <input type="text" value={item.reference} onChange={(e) => updateItem(item.id, "reference", e.target.value)} placeholder="Ref" style={inpStyle} />
                      </div>
                    </td>
                    <td style={cell({ padding: "4px 8px", verticalAlign: "top" })}>
                      <AutoTextarea
                        value={item.description}
                        onChange={(v) => updateItem(item.id, "description", v)}
                        placeholder="Description"
                      />
                    </td>
                    <td style={cell({ textAlign: "center", padding: "0 8px", height: "28px", verticalAlign: "top", position: data.commonPricing ? "relative" : undefined })}>
                      <div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <input type="text" inputMode="numeric" value={item.quantity === 0 ? "" : String(item.quantity)} onChange={(e) => handleQuantityChange(item.id, e.target.value)} placeholder="1" style={{ ...inpStyle, textAlign: "center" }} />
                      </div>
                      {data.commonPricing && (
                        <button onClick={() => removeItem(item.id)} disabled={data.lineItems.length === 1} style={{ ...floatingDeleteButtonStyle, opacity: data.lineItems.length === 1 ? 0.3 : 1, cursor: data.lineItems.length === 1 ? "not-allowed" : "pointer" }} title="Remove row">✕</button>
                      )}
                    </td>
                    {!data.commonPricing && (
                      <>
                        <td style={cell({ textAlign: "right", padding: "0 8px", height: "28px", verticalAlign: "top" })}>
                          <div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            <input type="text" inputMode="decimal" value={rawPrices[item.id] ?? (item.unitPrice === 0 ? "" : String(item.unitPrice))} onChange={(e) => handleUnitPriceChange(item.id, e.target.value)} onBlur={() => commitRawPrice(item.id)} placeholder="0.00" style={{ ...inpStyle, textAlign: "right" }} />
                          </div>
                        </td>
                        <td style={cell({ textAlign: "right", padding: "0 30px 0 8px", height: "28px", verticalAlign: "top", position: "relative" })}>
                          <div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            <input type="text" inputMode="decimal" value={rawAmounts[item.id] ?? (item.amount !== undefined ? fmt(item.amount) : (item.quantity * item.unitPrice === 0 ? "" : fmt(item.quantity * item.unitPrice)))} onChange={(e) => handleAmountChange(item.id, e.target.value)} onBlur={() => commitRawAmount(item.id)} placeholder="0.00" style={{ ...inpStyle, textAlign: "right" }} />
                          </div>
                          <button onClick={() => removeItem(item.id)} disabled={data.lineItems.length === 1} style={{ ...floatingDeleteButtonStyle, opacity: data.lineItems.length === 1 ? 0.3 : 1, cursor: data.lineItems.length === 1 ? "not-allowed" : "pointer" }} title="Remove row">✕</button>
                        </td>
                      </>
                    )}
                    {data.commonPricing && idx === 0 && (
                      <>
                        <td rowSpan={data.lineItems.length} style={cell({ textAlign: "right", padding: "0 8px", verticalAlign: "middle" })}>
                          <input type="text" inputMode="decimal" value={rawCommonPrice ?? (data.commonUnitPrice ? String(data.commonUnitPrice) : "")} onChange={(e) => handleCommonPriceChange(e.target.value)} onBlur={commitRawCommonPrice} placeholder="0.00" style={{ ...inpStyle, textAlign: "right" }} />
                        </td>
                        <td rowSpan={data.lineItems.length} style={cell({ textAlign: "right", padding: "0 8px", verticalAlign: "middle" })}>
                          <input type="text" inputMode="decimal" value={rawCommonAmount ?? (data.commonAmount ? fmt(data.commonAmount) : "")} onChange={(e) => handleCommonAmountChange(e.target.value)} onBlur={commitRawCommonAmount} placeholder="0.00" style={{ ...inpStyle, textAlign: "right" }} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {/* Filler rows — dynamically sized based on actual description heights */}
                {Array.from({ length: fillerCount }).map((_, i) => (
                  <tr key={`filler-${i}`}>
                    <td style={cell({ height: "28px" })} />
                    <td style={cell({ height: "28px" })} />
                    <td style={cell({ height: "28px" })} />
                    <td style={cell({ height: "28px" })} />
                    <td style={cell({ height: "28px" })} />
                  </tr>
                ))}

                {/* Totals — only when no extra sheets (combined totals go on last sheet) */}
                {!hasExtraSheets && (
                  <>
                    <tr>
                      <td colSpan={4} style={cell({ color: labelColor, height: "28px" })}>Total Value of Supply:</td>
                      <td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(totalExVAT)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} style={cell({ color: labelColor, height: "28px" })}>VAT Amount (Total Value of Supply @ 18%)</td>
                      <td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(vatAmount)}</td>
                    </tr>
                    <tr style={{ background: "#e8eef8" }}>
                      <td colSpan={4} style={cell({ fontWeight: "600", height: "28px" })}>Total Amount including VAT:</td>
                      <td style={cell({ textAlign: "right", fontWeight: "700", fontSize: "12px", height: "28px" })}>{fmt(totalIncVAT)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {!hasExtraSheets && (
                  <tr>
                    <td style={cell({ height: "28px" })}>
                      <span style={{ color: labelColor }}>Total Amount in words: </span>
                      <span style={{ color: "#1a2540", fontStyle: "italic", fontSize: "11px" }}>
                        {totalIncVAT > 0 ? numberToWords(totalIncVAT) : ""}
                      </span>
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={cell({ height: "28px" })}>
                    <span style={{ color: labelColor }}>Mode of Payment: </span>
                    <select value={data.paymentMode} onChange={(e) => update("paymentMode", e.target.value)} style={{ ...inpStyle, width: "auto", cursor: "pointer" }}>
                      <option value="">Select...</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Bank Transfer and Cheque">Bank Transfer / Cheque</option>
                      <option value="Credit">Credit</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ paddingTop: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", padding: "0 24px" }}>
                {["Authorized Signature (Supplier)", "Authorized Signature (Purchaser)"].map((label) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #8090b0", paddingTop: "5px", fontSize: "10px", color: labelColor }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "14px", paddingTop: "8px", borderTop: "1px solid #c0cce0" }}>
                <p style={{ fontSize: "8.5px", color: "#8090b0", letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
                  This is a computer-generated tax invoice — Wilro Wheel Alignment, Bandiyamulla, Gampaha — wilroenter8@gmail.com
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="no-print mx-auto" style={{ width: "210mm", marginTop: "8px" }}>
        {data.lineItems.length < mainPageMaxLines ? (
          <button onClick={addItem} style={{ background: "none", border: "1px dashed #7090c8", borderRadius: "6px", color: "#3060c0", fontSize: "11px", padding: "6px 12px", cursor: "pointer", fontFamily: "Arial, sans-serif", width: "100%" }}>
            + Add Line Item ({data.lineItems.length}/{mainPageMaxLines})
          </button>
        ) : (
          <div style={{ textAlign: "center", fontSize: "10px", color: "#8090b0", fontStyle: "italic", padding: "4px" }}>
            Maximum {mainPageMaxLines} lines per page — use &quot;Add New Sheet&quot; for more items
          </div>
        )}
      </div>

      {/* ══ EXTRA SHEETS ══════════════════════════════════════ */}
      {data.extraSheets.map((sheet) => (
        <ExtraSheetForm
          key={sheet.id}
          sheet={sheet}
          data={data}
          onChange={onChange}
        />
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════
   Extra Sheet — editable, same layout as first page
════════════════════════════════════════════════════ */
function ExtraSheetForm({
  sheet,
  data,
  onChange,
}: {
  sheet: ExtraSheet;
  data: InvoiceData;
  onChange: (d: InvoiceData) => void;
}) {
  const [rawPrices, setRawPrices] = useState<Record<string, string>>({});
  const [rawAmounts, setRawAmounts] = useState<Record<string, string>>({});

  const updateSheet = (updated: ExtraSheet) => {
    onChange({
      ...data,
      extraSheets: data.extraSheets.map((s) => (s.id === updated.id ? updated : s)),
    });
  };

  const removeSheet = () => {
    onChange({ ...data, extraSheets: data.extraSheets.filter((s) => s.id !== sheet.id) });
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    updateSheet({
      ...sheet,
      lineItems: sheet.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const addItem = () => {
    const maxLines = isLastSheet ? SUMMARY_PAGE_MAX_LINES : NON_SUMMARY_PAGE_MAX_LINES;
    if (sheet.lineItems.length >= maxLines) return;
    updateSheet({
      ...sheet,
      lineItems: [
        ...sheet.lineItems,
        { id: uuidv4(), reference: "", description: "", quantity: 0, unitPrice: 0 },
      ],
    });
  };

  const removeItem = (id: string) => {
    if (sheet.lineItems.length === 1) return;
    updateSheet({ ...sheet, lineItems: sheet.lineItems.filter((i) => i.id !== id) });
  };

  const normalizeLeadingZeros = (raw: string) => raw.replace(/^0+(?=\d)/, "");

  const handleQty = (id: string, raw: string) => {
    const d = raw.replace(/\D/g, "");
    const qty = parseInt(normalizeLeadingZeros(d) || "0", 10) || 0;
    updateSheet({
      ...sheet,
      lineItems: sheet.lineItems.map((item) =>
        item.id === id ? { ...item, quantity: qty, amount: undefined } : item
      ),
    });
  };

  const handlePrice = (id: string, raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const intPart = normalizeLeadingZeros(parts[0] ?? "");
    const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;
    const norm = decPart !== undefined ? `${intPart || "0"}.${decPart}` : intPart;
    setRawPrices((prev) => ({ ...prev, [id]: norm }));
    updateSheet({
      ...sheet,
      lineItems: sheet.lineItems.map((item) =>
        item.id === id ? { ...item, unitPrice: parseFloat(norm || "0") || 0, amount: undefined } : item
      ),
    });
  };

  const commitRawPrice = (id: string) => {
    setRawPrices((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const normalizeLeadingZerosE = (raw: string) => raw.replace(/^0+(?=\d)/, "");

  const handleAmountChange = (id: string, raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const intPart = normalizeLeadingZerosE(parts[0] ?? "");
    const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;
    const norm = decPart !== undefined ? `${intPart || "0"}.${decPart}` : intPart;
    setRawAmounts((prev) => ({ ...prev, [id]: norm }));
    const item = sheet.lineItems.find((i) => i.id === id);
    const qty = item?.quantity ?? 0;
    const amount = parseFloat(norm || "0") || 0;
    if (qty > 0) {
      const calcPrice = Math.round((amount / qty) * 100) / 100;
      setRawPrices((prev) => { const n = { ...prev }; delete n[id]; return n; });
      updateSheet({
        ...sheet,
        lineItems: sheet.lineItems.map((i) =>
          i.id === id ? { ...i, unitPrice: calcPrice, amount } : i
        ),
      });
    }
  };

  const commitRawAmount = (id: string) => {
    setRawAmounts((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const isLastSheet = sheet.id === data.extraSheets[data.extraSheets.length - 1]?.id;
  const combinedExVAT = computeExVAT(data);
  const combinedVAT   = combinedExVAT * 0.18;
  const combinedGrand = combinedExVAT + combinedVAT;

  return (
    <>
    <div className="bg-white shadow-lg mx-auto" style={{ width: "210mm", minHeight: "297mm", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", boxSizing: "border-box", marginTop: "24px", position: "relative", isolation: "isolate" }}>
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
        <img src="/logo.png" alt="" style={{ width: "340px", height: "auto", opacity: 0.08 }} />
      </div>
      {/* Letterhead */}
      <div style={{ borderBottom: "2px solid #b0b8d0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px 12px" }}>
          <div style={{ width: "78px", height: "78px", border: "2px solid #1e3a8a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "linear-gradient(135deg,#e8f0fe 0%,#c8d8f8 100%)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wilro Wheel Alignment" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: "900", letterSpacing: "2px", margin: 0, fontFamily: "Arial Black, sans-serif", textAlign: "center", lineHeight: 1 }}>
              <span style={{ color: "#f97316" }}>WILRO</span><span style={{ color: "#b0b8d0" }}>&nbsp;&nbsp;</span><span style={{ color: "#1e3a8a" }}>WHEEL ALIGNMENT</span>
            </h1>
            <div style={{ height: "1px", background: "#d0d8ec", width: "100%" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px 0", fontSize: "11px", color: "#3a4560", fontFamily: "Arial, sans-serif" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> 405, Colombo Road</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> Bandiyamulla</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#1e3a8a", fontWeight: "700" }}>📍</span> Gampaha</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>📞</span> 077 283 0826</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>📞</span> 033 223 9257</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f97316", fontWeight: "700" }}>✉</span> wilroenter8@gmail.com</span>
            </div>
          </div>
        </div>
        <div style={{ background: "#e8eef8", padding: "5px 20px", fontSize: "9.5px", color: "#3a4560", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", fontFamily: "Arial, sans-serif", borderTop: "1px solid #d0d8ec", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Precision Wheel Alignment, Balancing &amp; Automotive Care Services</span>
          <button onClick={removeSheet} style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", cursor: "pointer", fontFamily: "Arial, sans-serif", textTransform: "none", letterSpacing: "0" }}>✕ Remove Sheet</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", padding: "12px 20px 14px" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>

          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <span style={{ border: "1px solid #2a3560", padding: "3px 28px", fontSize: "12px", fontWeight: "600", color: "#1a2540", letterSpacing: "1px" }}>Invoice</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={cell({ width: "50%" })}>
                  <span style={{ color: labelColor }}>Date of Invoice: </span>
                  <input type="date" value={data.invoiceDate} onChange={(e) => onChange({ ...data, invoiceDate: e.target.value })} style={{ ...inpStyle, width: "auto" }} />
                  {data.invoiceDate && <span style={{ color: "#1a2540", fontWeight: 600, marginLeft: "4px" }}>({formatDate(data.invoiceDate)})</span>}
                </td>
                <td style={cell()}>
                  <span style={{ color: labelColor }}>Invoice No.: </span>
                  <input type="text" value={data.taxInvoiceNo} onChange={(e) => onChange({ ...data, taxInvoiceNo: e.target.value })} placeholder="e.g. INV-2024-001" style={{ ...inpStyle, width: "auto", minWidth: "170px" }} />
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={cell({ width: "50%", verticalAlign: "top" })}>
                  <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Suppliers TIN: </span><span style={readonlyStyle}>{data.supplierTIN}</span></div>
                  <div style={{ marginBottom: "2px" }}><span style={{ color: labelColor }}>Supplier s Name: </span><span style={readonlyStyle}>{data.supplierName}</span></div>
                  <div><span style={{ color: labelColor }}>Address: </span><span style={readonlyStyle}>{data.supplierAddress}</span></div>
                </td>
                <td style={cell({ verticalAlign: "top" })}>
                  <div style={{ marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: labelColor, whiteSpace: "nowrap" }}>Purchaser s TIN: </span><input type="text" value={data.purchaserTIN} onChange={(e) => onChange({ ...data, purchaserTIN: e.target.value })} placeholder="TIN" style={inpStyle} /></div>
                  <div style={{ marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: labelColor, whiteSpace: "nowrap" }}>Purchaser s Name: </span><input type="text" value={data.purchaserName} onChange={(e) => onChange({ ...data, purchaserName: e.target.value })} placeholder="Name" style={inpStyle} /></div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}><span style={{ color: labelColor, whiteSpace: "nowrap" }}>Address: </span><input type="text" value={data.purchaserAddress} onChange={(e) => onChange({ ...data, purchaserAddress: e.target.value })} placeholder="Full address" style={inpStyle} /></div>
                </td>
              </tr>
              <tr>
                <td style={cell()}><span style={{ color: labelColor }}>Telephone No.: </span><span style={readonlyStyle}>{data.supplierTel}</span></td>
                <td style={cell()}><span style={{ color: labelColor, whiteSpace: "nowrap" }}>Telephone No.: </span><input type="text" value={data.purchaserTel} onChange={(e) => onChange({ ...data, purchaserTel: e.target.value })} placeholder="Contact number" style={inpStyle} /></td>
              </tr>
              <tr>
                <td style={cell()}>
                  <span style={{ color: labelColor }}>Date of Delivery: </span>
                  <input type="date" value={data.deliveryDate} onChange={(e) => onChange({ ...data, deliveryDate: e.target.value })} style={{ ...inpStyle, width: "auto" }} />
                  {data.deliveryDate && <span style={{ color: "#1a2540", fontWeight: 600, marginLeft: "4px" }}>({formatDate(data.deliveryDate)})</span>}
                </td>
                <td style={cell()}>
                  <span style={{ color: labelColor, whiteSpace: "nowrap" }}>Place of Supply: </span>
                  <input type="text" list={`pos-list-extra-${sheet.id}`} value={data.placeOfSupply} onChange={(e) => onChange({ ...data, placeOfSupply: e.target.value })} placeholder="Type or select..." style={inpStyle} />
                  <datalist id={`pos-list-extra-${sheet.id}`}>
                    {["MINNERIYA","PANAGODA","MULATIVE","DIYATHAWALA","MORGAN ROAD","JAFFNA","SALIYAPURA","SALIYAPURA SANNADDA","UDAWALAWA","KOSGAMA","DEME","MINNERIYA (2)","KILINOCHCHIYA","KATUBEDDA","OTHER"].map((p) => <option key={p} value={p} />)}
                  </datalist>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={cell({ minHeight: "28px" })}>
                  <span style={{ color: labelColor }}>Additional Information if any: </span>
                  <input type="text" value={data.additionalInfo} onChange={(e) => onChange({ ...data, additionalInfo: e.target.value })} placeholder="Note" style={{ ...inpStyle, width: "auto", minWidth: "260px" }} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line Items — all rows, no pagination */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e8eef8" }}>
                <th style={cell({ textAlign: "left",   fontWeight: "600", width: "8%"  })}>Reference</th>
                <th style={cell({ textAlign: "left",   fontWeight: "600", width: "48%" })}>Description of Goods or Services</th>
                <th style={cell({ textAlign: "center", fontWeight: "600", width: "9%"  })}>Quantity</th>
                <th style={cell({ textAlign: "right",  fontWeight: "600", width: "13%" })}>Unit Price</th>
                <th style={cell({ textAlign: "right",  fontWeight: "600", width: "22%" })}>Amount Excl. VAT (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {sheet.lineItems.map((item, idx) => (
                <tr key={item.id}>
                  <td style={cell({ padding: "0 8px", height: "28px", verticalAlign: "top" })}><div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center" }}><input type="text" value={item.reference} onChange={(e) => updateItem(item.id, "reference", e.target.value)} placeholder="Ref" style={inpStyle} /></div></td>
                  <td style={cell({ padding: "4px 8px", verticalAlign: "top" })}><AutoTextarea value={item.description} onChange={(v) => updateItem(item.id, "description", v)} placeholder="Description" /></td>
                  <td style={cell({ textAlign: "center", padding: "0 8px", height: "28px", verticalAlign: "top", position: data.commonPricing ? "relative" : undefined })}>
                    <div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}><input type="text" inputMode="numeric" value={item.quantity === 0 ? "" : String(item.quantity)} onChange={(e) => handleQty(item.id, e.target.value)} placeholder="1" style={{ ...inpStyle, textAlign: "center" }} /></div>
                    {data.commonPricing && (
                      <button onClick={() => removeItem(item.id)} disabled={sheet.lineItems.length === 1} style={{ ...floatingDeleteButtonStyle, opacity: sheet.lineItems.length === 1 ? 0.3 : 1, cursor: sheet.lineItems.length === 1 ? "not-allowed" : "pointer" }} title="Remove row">✕</button>
                    )}
                  </td>
                  {!data.commonPricing && (
                    <>
                      <td style={cell({ textAlign: "right", padding: "0 8px", height: "28px", verticalAlign: "top" })}><div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "flex-end" }}><input type="text" inputMode="decimal" value={rawPrices[item.id] ?? (item.unitPrice === 0 ? "" : String(item.unitPrice))} onChange={(e) => handlePrice(item.id, e.target.value)} onBlur={() => commitRawPrice(item.id)} placeholder="0.00" style={{ ...inpStyle, textAlign: "right" }} /></div></td>
                      <td style={cell({ textAlign: "right", padding: "0 30px 0 8px", height: "28px", verticalAlign: "top", position: "relative" })}><div style={{ height: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "flex-end" }}><input type="text" inputMode="decimal" value={rawAmounts[item.id] ?? (item.amount !== undefined ? fmt(item.amount) : (item.quantity * item.unitPrice === 0 ? "" : fmt(item.quantity * item.unitPrice)))} onChange={(e) => handleAmountChange(item.id, e.target.value)} onBlur={() => commitRawAmount(item.id)} placeholder="0.00" style={{ ...inpStyle, textAlign: "right" }} /></div><button onClick={() => removeItem(item.id)} disabled={sheet.lineItems.length === 1} style={{ ...floatingDeleteButtonStyle, opacity: sheet.lineItems.length === 1 ? 0.3 : 1, cursor: sheet.lineItems.length === 1 ? "not-allowed" : "pointer" }} title="Remove row">✕</button></td>
                    </>
                  )}
                  {data.commonPricing && idx === 0 && (
                    <>
                      <td rowSpan={sheet.lineItems.length} style={cell({ textAlign: "right", padding: "0 8px", verticalAlign: "middle", color: labelColor, fontStyle: "italic" })}>
                        {fmt(data.commonUnitPrice ?? 0)}
                      </td>
                      <td rowSpan={sheet.lineItems.length} style={cell({ textAlign: "right", padding: "0 8px", verticalAlign: "middle", color: labelColor, fontStyle: "italic" })}>
                        {fmt(data.commonAmount ?? 0)}
                        <div style={{ fontSize: "8.5px", marginTop: "2px" }}>(set on main page)</div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Totals — only on the last sheet, showing combined grand total */}
              {isLastSheet && (
                <>
                  <tr><td colSpan={4} style={cell({ color: labelColor, height: "28px" })}>Total Value of Supply:</td><td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(combinedExVAT)}</td></tr>
                  <tr><td colSpan={4} style={cell({ color: labelColor, height: "28px" })}>VAT Amount (Total Value of Supply @ 18%)</td><td style={cell({ textAlign: "right", fontWeight: "600", height: "28px" })}>{fmt(combinedVAT)}</td></tr>
                  <tr style={{ background: "#e8eef8" }}><td colSpan={4} style={cell({ fontWeight: "600", height: "28px" })}>Total Amount including VAT:</td><td style={cell({ textAlign: "right", fontWeight: "700", fontSize: "12px", height: "28px" })}>{fmt(combinedGrand)}</td></tr>
                </>
              )}
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {isLastSheet && (
                <tr><td style={cell({ height: "28px" })}><span style={{ color: labelColor }}>Total Amount in words: </span><span style={{ color: "#1a2540", fontStyle: "italic", fontSize: "11px" }}>{combinedGrand > 0 ? numberToWords(combinedGrand) : ""}</span></td></tr>
              )}
              <tr>
                <td style={cell({ height: "28px" })}>
                  <span style={{ color: labelColor }}>Mode of Payment: </span>
                  <select value={data.paymentMode} onChange={(e) => onChange({ ...data, paymentMode: e.target.value })} style={{ ...inpStyle, width: "auto", cursor: "pointer" }}>
                    <option value="">Select...</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit">Credit</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ paddingTop: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", padding: "0 24px" }}>
              {["Authorized Signature (Supplier)", "Authorized Signature (Purchaser)"].map((label) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #8090b0", paddingTop: "5px", fontSize: "10px", color: labelColor }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "14px", paddingTop: "8px", borderTop: "1px solid #c0cce0" }}>
              <p style={{ fontSize: "8.5px", color: "#8090b0", letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
                This is a computer-generated tax invoice — Wilro Wheel Alignment, Bandiyamulla, Gampaha — wilroenter8@gmail.com
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Add Line Item button — outside the A4 form */}
    <div className="no-print mx-auto" style={{ width: "210mm", marginTop: "6px" }}>
      {sheet.lineItems.length < (isLastSheet ? SUMMARY_PAGE_MAX_LINES : NON_SUMMARY_PAGE_MAX_LINES) ? (
        <button onClick={addItem} style={{ background: "none", border: "1px dashed #7090c8", borderRadius: "6px", color: "#3060c0", fontSize: "11px", padding: "6px 12px", cursor: "pointer", fontFamily: "Arial, sans-serif", width: "100%" }}>
          + Add Line Item ({sheet.lineItems.length}/{isLastSheet ? SUMMARY_PAGE_MAX_LINES : NON_SUMMARY_PAGE_MAX_LINES})
        </button>
      ) : (
        <div style={{ textAlign: "center", fontSize: "10px", color: "#b45309", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "6px", padding: "5px 12px", fontFamily: "Arial, sans-serif" }}>
          Page full ({isLastSheet ? SUMMARY_PAGE_MAX_LINES : NON_SUMMARY_PAGE_MAX_LINES}/{isLastSheet ? SUMMARY_PAGE_MAX_LINES : NON_SUMMARY_PAGE_MAX_LINES} lines) — click <strong>Add New Sheet</strong> to continue
        </div>
      )}
    </div>
    </>
  );
}
