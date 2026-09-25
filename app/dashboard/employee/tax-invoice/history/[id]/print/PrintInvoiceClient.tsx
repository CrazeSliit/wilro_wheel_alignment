"use client";

import { useEffect } from "react";
import Link from "next/link";
import InvoicePreview from "../../../InvoicePreview";
import type { InvoiceData } from "@/lib/invoice-types";

export default function PrintInvoiceClient({ invoiceData }: { invoiceData: InvoiceData }) {
  useEffect(() => {
    // Wait for images (logo + watermark) to finish loading before printing —
    // calling window.print() immediately on mount could fire before they
    // fetch, printing them blank.
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      window.print();
    };

    const imgs = Array.from(document.images);
    const pending = imgs.filter((img) => !img.complete);

    if (pending.length === 0) {
      doPrint();
    } else {
      let remaining = pending.length;
      const onSettled = () => {
        remaining -= 1;
        if (remaining <= 0) doPrint();
      };
      pending.forEach((img) => {
        img.addEventListener("load", onSettled, { once: true });
        img.addEventListener("error", onSettled, { once: true });
      });
    }

    const safety = setTimeout(doPrint, 3000);
    return () => clearTimeout(safety);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="no-print border-b border-border px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Print Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">The browser print dialog opens automatically.</p>
        </div>
        <Link href="/dashboard/employee/tax-invoice/history" className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
          Back to History
        </Link>
      </div>

      <div className="print-scroll-wrapper flex-1 overflow-auto bg-muted/20 p-8">
        <div className="print-inner mx-auto overflow-x-auto">
          <InvoicePreview data={invoiceData} />
        </div>
      </div>
    </div>
  );
}
