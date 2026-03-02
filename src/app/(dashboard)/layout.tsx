import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getImpersonation } from "@/lib/impersonation";
import { getSelectedCompanyId, clearSelectedCompany } from "@/lib/company-cookie";
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

  // Multi-company gate: if no company cookie and user belongs to multiple companies,
  // redirect to the company selector page.
  const selectedCompanyId = await getSelectedCompanyId();

  if (!selectedCompanyId && !impersonation) {
    const companyCount = await prisma.user.count({
      where: {
        email: session.user.email!,
        role: { not: "EMPLOYEE" },
        archivedAt: null,
      },
    });

    if (companyCount > 1) {
      redirect("/select-company");
    }
  }

  let appUser;
  if (impersonation) {
    // Use the impersonated admin's identity
    appUser = await prisma.user.findUnique({
      where: { id: impersonation.userId },
      select: { name: true, email: true, avatar: true, role: true, companyId: true },
    });
  } else if (selectedCompanyId) {
    // Validate ownership — user must belong to the selected company
    appUser = await prisma.user.findFirst({
      where: {
        email: session.user.email!,
        companyId: selectedCompanyId,
        archivedAt: null,
      },
      select: { name: true, email: true, avatar: true, role: true, companyId: true },
    });

    // Tampered or stale cookie — clear and re-enter company selection
    if (!appUser) {
      await clearSelectedCompany();
      redirect("/select-company");
    }
  }

  // Fallback to existing behavior
  if (!appUser && !impersonation) {
    appUser = await prisma.user.findFirst({
      where: { email: session.user.email!, archivedAt: null },
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
      select: { encryptionSetupAt: true, name: true },
    });

    if (company && !company.encryptionSetupAt) {
      redirect("/setup-encryption");
    }
  }

  // Get company name and count for navigation
  const company = await prisma.company.findUnique({
    where: { id: appUser.companyId },
    select: { name: true },
  });
  const companyName = company?.name ?? "";

  const companyCount = await prisma.user.count({
    where: {
      email: appUser.email,
      role: { not: "EMPLOYEE" },
      archivedAt: null,
    },
  });

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar companyName={companyName} companyCount={companyCount} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {impersonation && (
            <ImpersonationBanner
              adminEmail={impersonation.email}
              companyId={impersonation.companyId}
            />
          )}
          <TopNav
            userName={appUser?.name}
            userAvatar={appUser?.avatar}
            companyName={companyName}
            companyCount={companyCount}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
