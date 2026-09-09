"use client";

import { useActionState } from "react";
import { updateProfile, ProfileState } from "@/app/actions/profile";

const initial: ProfileState = {};

type Props = {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string | null;
  defaultBio: string | null;
};

const input =
  "w-full rounded-xl border border-input bg-background text-foreground text-sm outline-none px-3.5 py-2.5 focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/40 transition";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground mb-1.5">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground font-normal text-xs"> {children}</span>;
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function ProfileForm({
  defaultName,
  defaultEmail,
  defaultPhone,
  defaultBio,
}: Props) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="flex flex-col gap-5">

      {/* ── Personal Information ─────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <SectionHeader
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Personal Information"
          description="Your name, contact details, and a short bio visible to your team."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <input
              id="name" name="name" type="text" required
              defaultValue={defaultName}
              className={input}
              placeholder="e.g. John Perera"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <input
              id="email" name="email" type="email" required
              defaultValue={defaultEmail}
              className={input}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="phone">
            Phone Number <Hint>(optional)</Hint>
          </Label>
          <input
            id="phone" name="phone" type="tel"
            defaultValue={defaultPhone ?? ""}
            placeholder="+94 77 123 4567"
            className={input}
          />
        </div>

        <div>
          <Label htmlFor="bio">
            About Me <Hint>(optional)</Hint>
          </Label>
          <textarea
            id="bio" name="bio" rows={3}
            defaultValue={defaultBio ?? ""}
            placeholder="A short bio about yourself…"
            className={`${input} resize-none`}
          />
        </div>
      </div>

      {/* ── Change Password ──────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <SectionHeader
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="Change Password"
          description="Leave all three fields blank to keep your current password unchanged."
        />

        <div className="mb-4">
          <Label htmlFor="currentPassword">Current Password</Label>
          <input
            id="currentPassword" name="currentPassword" type="password"
            autoComplete="current-password"
            placeholder="Enter your current password"
            className={input}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <input
              id="newPassword" name="newPassword" type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className={input}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <input
              id="confirmPassword" name="confirmPassword" type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              className={input}
            />
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
          </p>
        </div>
      </div>

      {/* ── Feedback ─────────────────────────────────── */}
      {state.error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.success}
        </div>
      )}

      {/* ── Submit bar ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
        <p className="text-xs text-muted-foreground hidden sm:block leading-relaxed">
          Changes are applied immediately after saving.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {pending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
