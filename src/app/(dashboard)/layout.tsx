import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getImpersonation } from "@/lib/impersonation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { ToastProvider } from "@/components/ui/toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check for super-admin impersonation session
  const impersonation = await getImpersonation();

  let appUser;
  if (impersonation) {
    // Use the impersonated admin's identity
    appUser = await prisma.user.findUnique({
      where: { id: impersonation.userId },
      select: { name: true, email: true, avatar: true, role: true, companyId: true },
    });
  } else {
    appUser = await prisma.user.findFirst({
      where: { email: session.user.email! },
      select: { name: true, email: true, avatar: true, role: true, companyId: true },
    });
  }

  // Super admin (SaaS owner) has no User record — redirect to superadmin panel
  if (!appUser) {
    const isSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: session.user.email! },
    });
    if (isSuperAdmin) {
      redirect("/superadmin");
    }
    redirect("/login");
  }

  if (appUser?.role === "ADMIN" && !impersonation) {
    const company = await prisma.company.findUnique({
      where: { id: appUser.companyId },
      select: { encryptionSetupAt: true, settings: true },
    });

    if (company && !company.encryptionSetupAt) {
      redirect("/setup-encryption");
    }

    if (company && company.encryptionSetupAt) {
      const settings = company.settings as { resend?: { apiKey?: string } } | null;
      if (!settings?.resend?.apiKey) {
        redirect("/setup-resend");
      }
    }
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {impersonation && (
            <ImpersonationBanner
              adminEmail={impersonation.email}
              companyId={impersonation.companyId}
            />
          )}
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
