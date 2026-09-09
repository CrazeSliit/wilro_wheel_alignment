import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard/employee");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar name={session.name} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
