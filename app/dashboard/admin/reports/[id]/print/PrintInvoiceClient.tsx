"use client";

import { useEffect } from "react";
import Link from "next/link";
import InvoicePreview from "@/app/dashboard/employee/tax-invoice/InvoicePreview";
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="no-print flex items-center justify-between gap-4 border-b border-border px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Print Invoice</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">The browser print dialog opens automatically.</p>
        </div>
        <Link
          href="/dashboard/admin/reports"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Back to Reports
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
