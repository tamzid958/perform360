import { NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";

export const GET = withSuperAdmin(async () => {
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

  return NextResponse.json({
    success: true,
    data: {
      totalCompanies,
      totalUsers,
      activeCycles,
      totalTemplates,
      evaluationsThisMonth,
      recentCompanies,
    },
  });
});
