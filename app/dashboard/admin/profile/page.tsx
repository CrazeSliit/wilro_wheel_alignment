import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/db";
import ProfileForm from "@/app/dashboard/employee/profile/ProfileForm";
import AvatarUpload from "@/app/dashboard/employee/profile/AvatarUpload";

export const metadata = { title: "Admin Profile — Iruka Motors" };

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard/employee");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const adminId = "ADM-" + user.id.slice(0, 8).toUpperCase();

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

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Hero Header ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-primary px-8 py-8">
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="relative z-10">
          <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-widest mb-1">
            Admin Portal
          </p>
          <h1 className="text-2xl font-bold text-primary-foreground leading-tight">My Profile</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            Update your administrator credentials, email, and personal information.
          </p>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 p-8 flex-1 min-h-0">

        {/* ══ LEFT: Identity Card ═══════════════════════ */}
        <aside className="lg:w-72 shrink-0">
          <div className="sticky top-8 flex flex-col gap-4">

            {/* Identity card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Cover */}
              <div className="h-24 bg-primary relative">
                <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="dots-admin" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.5" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots-admin)" />
                </svg>
                {/* ID chip */}
                <span className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm text-white/90 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full tracking-wide border border-white/20">
                  {adminId}
                </span>
                {/* Avatar overlapping cover */}
                <div className="absolute -bottom-9 left-5">
                  <div className="ring-4 ring-card rounded-full">
                    <AvatarUpload initials={initials} currentAvatar={user.avatar} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="pt-12 px-5 pb-5">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <h2 className="text-lg font-bold text-foreground leading-tight">{user.name}</h2>
                  <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary">
                    Administrator
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                    Full Access
                  </span>
                </div>

                <div className="h-px bg-border mb-4" />

                {/* Stat rows */}
                <ul className="flex flex-col gap-3">
                  <StatRow icon={<CalendarIcon />} label="Member since" value={memberSince} />
                  <StatRow icon={<PhoneIcon />} label="Phone" value={user.phone ?? "Not set"} muted={!user.phone} />
                  <StatRow icon={<ShieldIcon />} label="Role" value="Administrator" />
                </ul>
              </div>
            </div>

            {/* Bio card */}
            {user.bio && (
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  About
                </p>
                <p className="text-sm text-foreground leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Hint */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 border border-border">
              <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px] text-muted-foreground">
                Click your photo to upload a new one (max 500 KB).
              </p>
            </div>
          </div>
        </aside>

        {/* ══ RIGHT: Edit Form ══════════════════════════ */}
        <div className="flex-1 min-w-0">
          <ProfileForm
            defaultName={user.name}
            defaultEmail={user.email}
            defaultPhone={user.phone}
            defaultBio={user.bio}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Tiny helpers ────────────────────────────────────────── */

function StatRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          {label}
        </span>
        <span className={`text-sm font-medium truncate ${muted ? "text-muted-foreground italic" : "text-foreground"}`}>
          {value}
        </span>
      </div>
    </li>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
