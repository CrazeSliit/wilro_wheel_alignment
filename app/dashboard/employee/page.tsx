import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import prisma from "@/lib/db";
import Greeting from "@/components/ui/Greeting";

export const metadata = { title: "Dashboard — Iruka Motors" };

const departmentLabels: Record<string, string> = {
  SALES: "Sales",
  SERVICE: "Service",
  PARTS: "Parts",
  ADMINISTRATION: "Administration",
};

export default async function EmployeePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      phone: true,
      jobTitle: true,
      department: true,
      bio: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const firstName = user.name.split(" ")[0];

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fields = [user.name, user.email, user.phone, user.bio];
  const filled = fields.filter(Boolean).length;
  const completionPct = Math.round((filled / fields.length) * 100);

  const profileComplete = completionPct === 100;

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Welcome Banner ─────────────────────────────── */}
      <div className="relative overflow-hidden bg-primary px-8 py-9">
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <Greeting name={firstName} />
            <p className="text-primary-foreground/70 text-sm mt-1.5">
              {user.jobTitle
                ? `${user.jobTitle}${user.department ? ` · ${departmentLabels[user.department]}` : ""}`
                : "Welcome to your employee dashboard."}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 text-primary-foreground/90 text-sm font-medium px-4 py-2 rounded-xl self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Active
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-6">


        {/* ── Quick Actions ─────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              href="/dashboard/employee/profile"
              title="My Profile"
              description="Update your personal details, contact info and password."
              iconBg="bg-primary/10"
              iconColor="text-primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/employee/tax-invoice"
              title="Tax Invoice"
              description="Create and print Sri Lankan tax invoices."
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              }
            />
            <QuickAction
              href="/dashboard/employee/profile"
              title="Change Password"
              description="Update your account password for security."
              iconBg="bg-violet-50 dark:bg-violet-900/20"
              iconColor="text-violet-600"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Profile Card ──────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-foreground">My Profile</h2>
            </div>
            <Link
              href="/dashboard/employee/profile"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Edit profile
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold overflow-hidden ring-4 ring-primary/10">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Employee
              </span>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoField label="Full Name" value={user.name} />
              <InfoField label="Email" value={user.email} />
              <InfoField label="Phone" value={user.phone} />
              <InfoField label="Job Title" value={user.jobTitle} />
              <InfoField label="Member Since" value={memberSince} />
              {user.bio && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <InfoField label="About" value={user.bio} />
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="px-6 pb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Profile completion</span>
              <span className="text-xs font-semibold text-foreground">{completionPct}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completionPct === 100 ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {completionPct < 100 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Fill in the missing details to complete your profile.{" "}
                <Link href="/dashboard/employee/profile" className="text-primary font-medium hover:opacity-80">
                  Complete now →
                </Link>
              </p>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-medium ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
        {value ?? "Not set"}
      </p>
    </div>
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
      <div className="min-w-0 flex-1">
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
