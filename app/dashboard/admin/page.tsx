import { getSession } from "@/lib/session";
import Link from "next/link";
import { getAdminDashboardStats, getRecentEmployees } from "@/app/actions/profile";
import EmailStatusBadge from "@/components/admin/EmailStatusBadge";
import Greeting from "@/components/ui/Greeting";

export const metadata = { title: "Admin Dashboard — Iruka Motors" };

export default async function AdminPage() {
  const session = await getSession();
  const stats = await getAdminDashboardStats();
  const recentEmployees = await getRecentEmployees(5);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-primary px-8 py-9">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <Greeting name={session?.name ?? "Admin"} />
            <p className="text-primary-foreground/70 text-sm mt-1.5">
              Here&apos;s your Iruka Motors admin overview.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/dashboard/admin/employees/create"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="3.5" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
              Add Employee
            </Link>
            <Link
              href="/dashboard/admin/employees"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              View All
            </Link>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* ── Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Employees"
            value={stats.totalEmployees}
            description="Active staff"
            colorClass="text-sky-600"
            bgClass="bg-sky-50 dark:bg-sky-900/20"
            href="/dashboard/admin/employees"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            label="New This Month"
            value={stats.newThisMonth}
            description="Recently joined"
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50 dark:bg-emerald-900/20"
            href="/dashboard/admin/employees"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="3.5" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
            }
          />
          <StatCard
            label="Email Failed"
            value={stats.emailFailed}
            description="Needs attention"
            colorClass={stats.emailFailed > 0 ? "text-rose-600" : "text-slate-400"}
            bgClass={stats.emailFailed > 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-50 dark:bg-slate-800/30"}
            href="/dashboard/admin/employees"
            highlight={stats.emailFailed > 0}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <line x1="10" y1="19" x2="14" y2="19" />
              </svg>
            }
          />
          <StatCard
            label="Deactivated"
            value={stats.deactivated}
            description="Inactive accounts"
            colorClass="text-slate-500"
            bgClass="bg-slate-50 dark:bg-slate-800/30"
            href="/dashboard/admin/employees"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="3.5" />
                <line x1="18" y1="8" x2="23" y2="13" />
                <line x1="23" y1="8" x2="18" y2="13" />
              </svg>
            }
          />
        </div>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              href="/dashboard/admin/employees/create"
              title="Create Employee Account"
              description="Add a new staff member and send login credentials."
              iconBg="bg-primary/10"
              iconColor="text-primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="3.5" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/admin/employees"
              title="Manage Employees"
              description="View, edit, or deactivate employee accounts."
              iconBg="bg-sky-50 dark:bg-sky-900/20"
              iconColor="text-sky-600"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/admin/reports"
              title="View Reports"
              description="Access business reports and analytics."
              iconBg="bg-violet-50 dark:bg-violet-900/20"
              iconColor="text-violet-600"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Recent Employees ──────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-foreground">Recent Employees</h2>
            </div>
            <Link
              href="/dashboard/admin/employees"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-muted-foreground">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">No employees yet.</p>
              <Link
                href="/dashboard/admin/employees/create"
                className="text-sm font-medium text-primary hover:underline"
              >
                Add your first employee →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Date Added</th>
                    <th className="px-6 py-3 font-medium">Email Status</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentEmployees.map((emp) => {
                    const initials = emp.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <span className="font-medium text-foreground">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">{emp.email}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {new Date(emp.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <EmailStatusBadge status={emp.emailStatus} />
                        </td>
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/dashboard/admin/employees/${emp.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── System Info ──────────────────────────────────────── */}
       

      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  description,
  colorClass,
  bgClass,
  href,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  description: string;
  colorClass: string;
  bgClass: string;
  href: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative bg-card border rounded-2xl p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${
        highlight ? "border-rose-200 dark:border-rose-800" : "border-border"
      }`}
    >
      {highlight && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      )}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bgClass} ${colorClass}`}>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-sm font-medium text-foreground mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </Link>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  iconBg,
  iconColor,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex gap-4 items-start"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-0.5"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
