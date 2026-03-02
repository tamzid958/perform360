import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Building2,
  Users,
  RefreshCcw,
  Layers,
  TrendingUp,
  Shield,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ResetEncryptionButton } from "./reset-encryption-button";
const CUID_REGEX = /^c[a-z0-9]{20,28}$/;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700",
  HR: "bg-purple-50 text-purple-700",
  EMPLOYEE: "bg-gray-50 text-gray-700",
  EXTERNAL: "bg-orange-50 text-orange-700",
};

const CYCLE_STATUS_VARIANT: Record<string, "default" | "success" | "info" | "outline"> = {
  DRAFT: "default",
  ACTIVE: "success",
  CLOSED: "info",
  ARCHIVED: "outline",
};

async function getCompanyAnalytics(companyId: string) {
  const [
    company,
    roleDistribution,
    totalUsers,
    teams,
    cycles,
    assignmentsByStatus,
    totalTemplates,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        encryptionSetupAt: true,
        keyVersion: true,
      },
    }),
    prisma.user.groupBy({
      by: ["role"],
      where: { companyId },
      _count: true,
    }),
    prisma.user.count({ where: { companyId } }),
    prisma.team.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.evaluationCycle.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.evaluationAssignment.groupBy({
      by: ["status"],
      where: { cycle: { companyId } },
      _count: true,
    }),
    prisma.evaluationTemplate.count({ where: { companyId } }),
  ]);

  if (!company) return null;

  const statusMap: Record<string, number> = {};
  for (const item of assignmentsByStatus) {
    statusMap[item.status] = item._count;
  }
  const totalAssignments = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const submittedCount = statusMap["SUBMITTED"] ?? 0;
  const completionRate = totalAssignments > 0
    ? Math.round((submittedCount / totalAssignments) * 100)
    : 0;

  // Get per-cycle submitted counts
  const cycleAssignments = await prisma.evaluationAssignment.groupBy({
    by: ["cycleId", "status"],
    where: { cycle: { companyId } },
    _count: true,
  });

  const cycleSubmittedMap: Record<string, number> = {};
  for (const item of cycleAssignments) {
    if (item.status === "SUBMITTED") {
      cycleSubmittedMap[item.cycleId] = item._count;
    }
  }

  return {
    company: {
      ...company,
      encryptionConfigured: company.encryptionSetupAt !== null,
    },
    stats: {
      totalUsers,
      totalTeams: teams.length,
      totalCycles: cycles.length,
      totalTemplates,
      completionRate,
      totalAssignments,
      submittedCount,
    },
    roleDistribution: roleDistribution.map((r) => ({
      role: r.role,
      count: r._count,
    })),
    cycles: cycles.map((c) => ({
      ...c,
      assignmentCount: c._count.assignments,
      submittedCount: cycleSubmittedMap[c.id] ?? 0,
    })),
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      memberCount: t._count.members,
    })),
  };
}

export default async function CompanyAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!CUID_REGEX.test(id)) notFound();

  const data = await getCompanyAnalytics(id);
  if (!data) notFound();

  const { company, stats, roleDistribution, cycles, teams } = data;

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, accent: "bg-blue-50 text-blue-500" },
    { label: "Teams", value: stats.totalTeams, icon: Layers, accent: "bg-purple-50 text-purple-500" },
    { label: "Cycles", value: stats.totalCycles, icon: RefreshCcw, accent: "bg-amber-50 text-amber-500" },
    { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp, accent: "bg-green-50 text-green-500" },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/superadmin/companies"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0071e3] hover:text-[#0058b9] transition-colors mb-6"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back to Companies
      </Link>

      {/* Company Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Building2 size={24} strokeWidth={1.5} className="text-gray-400" />
          </div>
          <div>
            <h1 className="text-title text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-body text-gray-500">{company.slug}</p>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
                <Calendar size={13} strokeWidth={1.5} />
                Created {formatDate(company.createdAt)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={company.encryptionConfigured ? "success" : "warning"}>
            <Shield size={12} strokeWidth={1.5} className="mr-1" />
            {company.encryptionConfigured ? "Encryption Configured" : "Encryption Pending"}
          </Badge>
          {company.encryptionConfigured && (
            <ResetEncryptionButton
              companyId={company.id}
              companyName={company.name}
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md" className="group hover:shadow-md transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-[28px] font-bold text-gray-900 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.accent}`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Distribution of users by role</CardDescription>
            </CardHeader>
            {roleDistribution.length === 0 ? (
              <p className="text-[14px] text-gray-400 text-center py-4">No users yet</p>
            ) : (
              <div className="space-y-3">
                {roleDistribution.map((item) => {
                  const pct = stats.totalUsers > 0 ? Math.round((item.count / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={item.role} className="flex items-center gap-3">
                      <Badge variant="outline" className={ROLE_COLORS[item.role]}>
                        {item.role}
                      </Badge>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gray-900 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[13px] font-medium text-gray-600 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cycles */}
          <Card padding="sm">
            <CardHeader>
              <CardTitle>Evaluation Cycles</CardTitle>
              <CardDescription>{cycles.length} total cycles</CardDescription>
            </CardHeader>
            {cycles.length === 0 ? (
              <p className="text-[14px] text-gray-400 text-center py-6 px-4">No cycles created yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                        Cycle
                      </th>
                      <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                        Date Range
                      </th>
                      <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cycles.map((cycle) => {
                      const pct = cycle.assignmentCount > 0
                        ? Math.round((cycle.submittedCount / cycle.assignmentCount) * 100)
                        : 0;
                      return (
                        <tr key={cycle.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-[14px] font-medium text-gray-900">{cycle.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={CYCLE_STATUS_VARIANT[cycle.status] ?? "default"}>
                              {cycle.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-500">
                            {formatDate(cycle.startDate)} &mdash; {formatDate(cycle.endDate)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="w-20" />
                              <span className="text-[12px] text-gray-500">
                                {cycle.submittedCount}/{cycle.assignmentCount}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          {/* Completion Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Completion</CardTitle>
            </CardHeader>
            <div className="text-center py-2">
              <p className="text-[36px] font-bold text-gray-900 tracking-tight">
                {stats.completionRate}%
              </p>
              <Progress value={stats.completionRate} className="mt-3" />
              <p className="text-[12px] text-gray-400 mt-2">
                {stats.submittedCount} of {stats.totalAssignments} evaluations submitted
              </p>
            </div>
          </Card>

          {/* Teams */}
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>{teams.length} total</CardDescription>
            </CardHeader>
            {teams.length === 0 ? (
              <p className="text-[14px] text-gray-400 text-center py-4">No teams yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between py-2.5">
                    <p className="text-[14px] font-medium text-gray-900">{team.name}</p>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
                      <Users size={14} strokeWidth={1.5} />
                      {team.memberCount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
