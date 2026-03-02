import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const { id: cycleId, subjectId } = await params;

  const invalidCycle = validateCuidParam(cycleId);
  if (invalidCycle) return invalidCycle;
  const invalidSubject = validateCuidParam(subjectId);
  if (invalidSubject) return invalidSubject;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;
  const { companyId, userId } = authResult;

  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, companyId },
    select: { id: true, status: true },
  });

  if (!cycle) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Cycle not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (cycle.status !== "CLOSED") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Calibration can only be modified on closed cycles", code: "INVALID_STATUS" },
      { status: 400 }
    );
  }

  // Get teamId from query params (member can be in multiple teams)
  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "teamId query parameter is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  try {
    await prisma.calibrationAdjustment.delete({
      where: {
        cycleId_teamId_subjectId: { cycleId, teamId, subjectId },
      },
    });

    await writeAuditLog({
      companyId,
      userId,
      action: "calibration_adjust",
      target: `user:${subjectId}`,
      metadata: { cycleId, teamId, type: "member_override_removed" },
    });

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Calibration adjustment not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
}
