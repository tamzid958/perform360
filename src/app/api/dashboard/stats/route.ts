import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const companyId = authResult.companyId;

  const [activeCycles, totalTeams, assignments] = await Promise.all([
    prisma.evaluationCycle.count({
      where: { companyId, status: "ACTIVE" },
    }),
    prisma.team.count({
      where: { companyId },
    }),
    prisma.evaluationAssignment.findMany({
      where: {
        cycle: { companyId, status: "ACTIVE" },
      },
      select: { status: true },
    }),
  ]);

  const totalAssignments = assignments.length;
  const pendingReviews = assignments.filter((a) => a.status !== "SUBMITTED").length;
  const submittedReviews = totalAssignments - pendingReviews;
  const completionRate = totalAssignments > 0
    ? Math.round((submittedReviews / totalAssignments) * 100)
    : 0;

  return NextResponse.json({
    success: true,
    data: {
      activeCycles,
      totalTeams,
      pendingReviews,
      completionRate,
    },
  });
}
