import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Users, RefreshCcw, FileText, TrendingUp, UserPlus, BarChart3 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

async function getPlatformData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalCompanies,
    totalUsers,
    activeCycles,
    totalTemplates,
    evaluationsThisMonth,
    recentCompanyCount,
    previousMonthCompanyCount,
    newUsersThisMonth,
    cyclesByStatus,
    totalAssignments,
    submittedAssignments,
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
    prisma.company.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.evaluationCycle.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.evaluationAssignment.count(),
    prisma.evaluationAssignment.count({ where: { status: "SUBMITTED" } }),
    prisma.company.findMany({
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
    }),
  ]);

  const cycleStatusMap: Record<string, number> = {};
  for (const item of cyclesByStatus) {
    cycleStatusMap[item.status] = item._count;
  }

  const completionRate = totalAssignments > 0
    ? Math.round((submittedAssignments / totalAssignments) * 100)
    : 0;

  const companyGrowth = recentCompanyCount - previousMonthCompanyCount;

  return {
    totalCompanies,
    totalUsers,
    activeCycles,
    totalTemplates,
    evaluationsThisMonth,
    recentCompanyCount,
    newUsersThisMonth,
    companyGrowth,
    completionRate,
    totalAssignments,
    submittedAssignments,
    cycleStatusMap,
    recentCompanies,
  };
}

export default async function SuperAdminDashboard() {
  const data = await getPlatformData();

  const statCards = [
    {
      label: "Total Companies",
      value: data.totalCompanies.toLocaleString(),
      icon: Building2,
      change: `+${data.recentCompanyCount} this month`,
    },
    {
      label: "Total Users",
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      change: `Across ${data.totalCompanies} companies`,
    },
    {
      label: "Active Cycles",
      value: data.activeCycles.toLocaleString(),
      icon: RefreshCcw,
      change: `${data.evaluationsThisMonth} submissions this month`,
    },
    {
      label: "Global Templates",
      value: data.totalTemplates.toLocaleString(),
      icon: FileText,
      change: "Available to all companies",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-title text-gray-900">Platform Overview</h1>
        <p className="text-body text-gray-500 mt-1">
          Performs360 platform analytics and management
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

      {/* Platform Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-start justify-between mb-3">
            <p className="text-callout text-gray-500">Overall Completion</p>
            <div className="p-2 rounded-xl bg-green-50">
              <TrendingUp size={16} strokeWidth={1.5} className="text-green-500" />
            </div>
          </div>
          <p className="text-title-small text-gray-900 mb-3">{data.completionRate}%</p>
          <Progress value={data.completionRate} />
          <p className="text-[12px] text-gray-400 mt-2">
            {data.submittedAssignments} of {data.totalAssignments} evaluations
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between mb-3">
            <p className="text-callout text-gray-500">New Users (30d)</p>
            <div className="p-2 rounded-xl bg-blue-50">
              <UserPlus size={16} strokeWidth={1.5} className="text-blue-500" />
            </div>
          </div>
          <p className="text-title-small text-gray-900">{data.newUsersThisMonth}</p>
          <p className="text-[12px] text-gray-400 mt-1">
            Joined in the last 30 days
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between mb-3">
            <p className="text-callout text-gray-500">Company Growth</p>
            <div className="p-2 rounded-xl bg-purple-50">
              <BarChart3 size={16} strokeWidth={1.5} className="text-purple-500" />
            </div>
          </div>
          <p className="text-title-small text-gray-900">
            {data.companyGrowth >= 0 ? "+" : ""}{data.companyGrowth}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            vs. previous 30 days
          </p>
        </Card>
      </div>

      {/* Cycle Status Overview */}
      <Card padding="sm" className="mb-8">
        <CardHeader>
          <CardTitle>Cycle Status Overview</CardTitle>
          <CardDescription>Distribution of evaluation cycles across all tenants</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-4 pb-4">
          <div className="text-center p-4 rounded-xl bg-gray-50/80 border border-gray-100/50">
            <p className="text-[24px] font-bold text-gray-700 tracking-tight">
              {data.cycleStatusMap["DRAFT"] ?? 0}
            </p>
            <p className="text-[12px] font-medium text-gray-500 mt-0.5">Draft</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-green-50/60 border border-green-100/50">
            <p className="text-[24px] font-bold text-green-700 tracking-tight">
              {data.cycleStatusMap["ACTIVE"] ?? 0}
            </p>
            <p className="text-[12px] font-medium text-green-600 mt-0.5">Active</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-blue-50/60 border border-blue-100/50">
            <p className="text-[24px] font-bold text-blue-700 tracking-tight">
              {data.cycleStatusMap["CLOSED"] ?? 0}
            </p>
            <p className="text-[12px] font-medium text-blue-600 mt-0.5">Closed</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50/60 border border-gray-200/50">
            <p className="text-[24px] font-bold text-gray-500 tracking-tight">
              {data.cycleStatusMap["ARCHIVED"] ?? 0}
            </p>
            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Archived</p>
          </div>
        </div>
      </Card>

      {/* Recent Companies */}
      <Card padding="sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Recent Companies</CardTitle>
              <CardDescription>Latest tenant organizations on the platform</CardDescription>
            </div>
            <Link
              href="/superadmin/companies"
              className="text-[14px] font-medium text-brand-500 hover:text-brand-600 active:text-brand-700 transition-colors"
            >
              View all
            </Link>
          </div>
        </CardHeader>

        {/* Mobile card layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {data.recentCompanies.length === 0 ? (
            <div className="px-4 py-8 text-center text-[14px] text-gray-400">
              No companies registered yet
            </div>
          ) : (
            data.recentCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/superadmin/companies/${company.id}`}
                className="block px-4 py-3 active:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[14px] font-semibold text-gray-500 shrink-0">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">
                      {company.name}
                    </p>
                    <p className="text-[12px] text-gray-500">{company.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[13px] text-gray-500 ml-12">
                  <span className="flex items-center gap-1">
                    <Users size={14} strokeWidth={1.5} className="text-gray-400" />
                    {company._count.users} users
                  </span>
                  <span>{company._count.cycles} cycles</span>
                  <Badge variant={company.encryptionSetupAt ? "success" : "warning"}>
                    {company.encryptionSetupAt ? "Configured" : "Pending"}
                  </Badge>
                  <span>{formatDate(company.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop table layout */}
        <div className="hidden md:block overflow-x-auto">
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
              {data.recentCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[14px] text-gray-400">
                    No companies registered yet
                  </td>
                </tr>
              ) : (
                data.recentCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/superadmin/companies/${company.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[14px] font-semibold text-gray-500">
                          {company.name[0]}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-gray-900 group-hover:text-brand-500 transition-colors">
                            {company.name}
                          </p>
                          <p className="text-[12px] text-gray-500">{company.slug}</p>
                        </div>
                      </Link>
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
