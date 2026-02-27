import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildIndividualReport } from "@/lib/reports";
import type { IndividualReport } from "@/types/report";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; uid: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const { id: cycleId, uid: subjectId } = params;
  const { companyId } = authResult;

  // Verify cycle belongs to user's company
  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, companyId },
    select: { id: true },
  });

  if (!cycle) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Cycle not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Verify subject belongs to user's company
  const subject = await prisma.user.findFirst({
    where: { id: subjectId, companyId },
    select: { id: true },
  });

  if (!subject) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "User not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const report = await buildIndividualReport(cycleId, subjectId, companyId);

    return NextResponse.json<ApiResponse<IndividualReport>>({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
