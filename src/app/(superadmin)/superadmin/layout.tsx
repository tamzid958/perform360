import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuperAdminShell } from "./admin-shell";
import { ToastProvider } from "@/components/ui/toast";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: session.user.email },
  });

  if (!superAdmin) {
    redirect("/");
  }

  return (
    <ToastProvider>
      <SuperAdminShell>{children}</SuperAdminShell>
    </ToastProvider>
  );
}
