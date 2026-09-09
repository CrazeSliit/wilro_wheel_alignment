"use client";

import { useEffect } from "react";
import Link from "next/link";
import InvoicePreview from "@/app/dashboard/employee/tax-invoice/InvoicePreview";
import type { InvoiceData } from "@/lib/invoice-types";

export default function PrintInvoiceClient({ invoiceData }: { invoiceData: InvoiceData }) {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="no-print flex items-center justify-between gap-4 border-b border-border px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Print Tax Invoice</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">The browser print dialog opens automatically.</p>
        </div>
        <Link
          href="/dashboard/admin/reports"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Back to Reports
        </Link>
      </div>

      <div className="flex-1 overflow-auto bg-muted/20 p-8">
        <div className="mx-auto overflow-x-auto">
          <InvoicePreview data={invoiceData} />
        </div>
      </div>
    </div>
  );
}
