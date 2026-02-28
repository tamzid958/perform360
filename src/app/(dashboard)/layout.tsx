import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ToastProvider } from "@/components/ui/toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const appUser = await prisma.user.findFirst({
    where: { email: session.user.email! },
    select: { name: true, email: true, avatar: true, role: true, companyId: true },
  });

  if (appUser?.role === "ADMIN") {
    const company = await prisma.company.findUnique({
      where: { id: appUser.companyId },
      select: { encryptionSetupAt: true },
    });

    if (company && !company.encryptionSetupAt) {
      redirect("/setup-encryption");
    }
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav
            userName={appUser?.name}
            userEmail={appUser?.email}
            userAvatar={appUser?.avatar}
          />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
