import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import EmployeeSidebar from "./EmployeeSidebar";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/dashboard/admin");

  return (
    <div className="flex min-h-screen bg-background">
      <EmployeeSidebar name={session.name} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
