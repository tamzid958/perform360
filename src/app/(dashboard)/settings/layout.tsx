import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const appUser = await prisma.user.findFirst({
    where: { email: session.user.email, archivedAt: null },
    select: { role: true },
  });

  if (appUser?.role !== "ADMIN") {
    redirect("/overview");
  }

  return <>{children}</>;
}
