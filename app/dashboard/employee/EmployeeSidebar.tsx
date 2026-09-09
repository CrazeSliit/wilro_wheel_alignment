"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard/employee",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4.5 h-4.5 shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Tax Invoice",
    href: "/dashboard/employee/tax-invoice",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4.5 h-4.5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
        <line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13" />
        <line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Invoice History",
    href: "/dashboard/employee/tax-invoice/history",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4.5 h-4.5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2" />
      </svg>
    ),
  },
  {
    label: "Image Scanner",
    href: "/dashboard/employee/image-ocr",
    newTab: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4.5 h-4.5 shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path strokeLinecap="round" d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
];

export default function EmployeeSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm md:hidden print:hidden"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
        />
      )}

      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >

      {/* ── Brand ───────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0 shadow-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-sidebar-primary-foreground">
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h-4l-3 5.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l3 5.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 11.5h9" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight tracking-tight truncate">
              Iruka Motors
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest truncate">
                Employee Portal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section label ───────────────────────────── */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Navigation
        </p>
      </div>

      {/* ── Nav items ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.newTab ? "_blank" : undefined}
              rel={item.newTab ? "noopener noreferrer" : undefined}
              onClick={() => setIsOpen(false)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {/* Active left accent */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 rounded-r-full bg-sidebar-primary-foreground/50" />
              )}

              <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}>
                {item.icon}
              </span>

              <span className="flex-1">{item.label}</span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ──────────────────────────── */}
      <div className="border-t border-sidebar-border">

        {/* Account label */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Account
          </p>
        </div>

        {/* Profile link */}
        <div className="px-3 pb-2">
          <Link
            href="/dashboard/employee/profile"
            onClick={() => setIsOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              pathname === "/dashboard/employee/profile"
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <span className={`transition-opacity ${pathname === "/dashboard/employee/profile" ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4.5 h-4.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            My Profile
          </Link>
        </div>

        {/* User card + logout */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent border border-sidebar-border/60">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-sidebar-foreground truncate leading-tight">
                {name}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                Employee
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline strokeLinecap="round" strokeLinejoin="round" points="16 17 21 12 16 7" />
                  <line strokeLinecap="round" x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>

      </div>
      </aside>
    </>
  );
}
