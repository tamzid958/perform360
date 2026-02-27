import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuperAdminShell } from "./admin-shell";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Verify user is a Super Admin (stored in SuperAdmin table, not User table)
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: session.user.email },
  });

  if (!superAdmin) {
    redirect("/");
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}
