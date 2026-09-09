"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

type Props = {
  paymentModes: string[];
  total: number;
  filtered: number;
};

export default function ReportFilters({ paymentModes, total, filtered }: Props) {
  const router    = useRouter();
  const pathname  = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      return params.toString();
    },
    [searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const qs = buildParams(key, value);
      startTransition(() => router.replace(`${pathname}?${qs}`));
    },
    [buildParams, router, pathname]
  );

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const qs = buildParams("search", value);
      startTransition(() => router.replace(`${pathname}?${qs}`));
    }, 350);
  };

  const clearAll = () => {
    setSearchText("");
    startTransition(() => router.replace(pathname));
  };

  const payment  = searchParams.get("payment") ?? "";
  const mode     = searchParams.get("mode") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const hasFilters = searchText || payment || mode || dateFrom;

  return (
    <div
      className={`mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-opacity ${
        isPending ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-wrap gap-3 items-end">

        {/* Search */}
        <div className="flex flex-col gap-1 min-w-60 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Invoice no., purchaser, employee or place of supply..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Payment</label>
          <div className="flex rounded-xl border border-border bg-background overflow-hidden text-sm font-medium">
            {(["", "unpaid", "paid"] as const).map((val) => {
              const label = val === "" ? "All" : val === "paid" ? "Paid" : "Unpaid";
              const active = payment === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setParam("payment", val)}
                  className={`px-3 py-2 transition-colors ${
                    active
                      ? val === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : val === "unpaid"
                        ? "bg-red-50 text-red-600"
                        : "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Mode */}
        {paymentModes.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Payment Mode</label>
            <select
              value={mode}
              onChange={(e) => setParam("mode", e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Modes</option>
              {paymentModes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Invoice Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Invoice Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setParam("from", e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="self-end inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {hasFilters && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered}</span> of{" "}
          <span className="font-semibold text-foreground">{total}</span> invoices
        </p>
      )}
    </div>
  );
}
