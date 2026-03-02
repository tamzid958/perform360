import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getImpersonation } from "@/lib/impersonation";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const impersonation = await getImpersonation();

  let role: string | undefined;
  if (impersonation) {
    role = impersonation.role;
  } else {
    const appUser = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { role: true },
    });
    role = appUser?.role;
  }

  if (role !== "ADMIN") {
    redirect("/overview");
  }

  return <>{children}</>;
}
