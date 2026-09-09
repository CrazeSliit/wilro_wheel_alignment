import { redirect } from "next/navigation";
import ChangePasswordForm from "@/app/change-password/ChangePasswordForm";
import { getSession } from "@/lib/session";
import prisma from "@/lib/db";

export const metadata = { title: "Change Password - Iruka Motors" };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isFirstLogin: true, role: true },
  });

  if (!user) redirect("/login");
  if (!user.isFirstLogin) redirect(user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/employee");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-md">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Set Your New Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For security, you must set a personal password before continuing.
        </p>

        <div className="mt-5">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
