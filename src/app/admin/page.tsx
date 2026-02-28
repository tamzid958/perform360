import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, RefreshCcw, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCompanies,
    totalUsers,
    activeCycles,
    totalTemplates,
    evaluationsThisMonth,
    recentCompanies,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.evaluationCycle.count({ where: { status: "ACTIVE" } }),
    prisma.evaluationTemplate.count({ where: { isGlobal: true, companyId: null } }),
    prisma.evaluationResponse.count({
      where: { submittedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.company.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  return {
    totalCompanies,
    totalUsers,
    activeCycles,
    totalTemplates,
    evaluationsThisMonth,
    recentCompanies,
  };
}

async function getRecentCompanies() {
  return prisma.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      encryptionSetupAt: true,
      _count: {
        select: {
          users: true,
          cycles: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function SuperAdminDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: session.user.email },
  });
  if (!superAdmin) redirect("/");

  const [stats, companies] = await Promise.all([
    getStats(),
    getRecentCompanies(),
  ]);

  const statCards = [
    {
      label: "Total Companies",
      value: stats.totalCompanies.toLocaleString(),
      icon: Building2,
      change: `+${stats.recentCompanies} this month`,
    },
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: `Across ${stats.totalCompanies} companies`,
    },
    {
      label: "Active Cycles",
      value: stats.activeCycles.toLocaleString(),
      icon: RefreshCcw,
      change: `${stats.evaluationsThisMonth} submissions this month`,
    },
    {
      label: "Global Templates",
      value: stats.totalTemplates.toLocaleString(),
      icon: FileText,
      change: "Available to all companies",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-title text-gray-900">Platform Overview</h1>
        <p className="text-body text-gray-500 mt-1">
          Perform360 platform analytics and management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-callout text-gray-500">{stat.label}</p>
                  <p className="text-title-small text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-[12px] text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50">
                  <Icon size={20} strokeWidth={1.5} className="text-gray-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Companies */}
      <Card padding="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Companies</CardTitle>
              <CardDescription>Latest tenant organizations on the platform</CardDescription>
            </div>
            <Link
              href="/admin/companies"
              className="text-[14px] font-medium text-[#0071e3] hover:text-[#0058b9] transition-colors"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Company
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Users
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Active Cycles
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Encryption
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[14px] text-gray-400">
                    No companies registered yet
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[14px] font-semibold text-gray-500">
                          {company.name[0]}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-gray-900">
                            {company.name}
                          </p>
                          <p className="text-[12px] text-gray-500">{company.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users size={14} strokeWidth={1.5} className="text-gray-400" />
                        {company._count.users}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-600">
                      {company._count.cycles}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={company.encryptionSetupAt ? "success" : "warning"}>
                        {company.encryptionSetupAt ? "Configured" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">
                      {formatDate(company.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
