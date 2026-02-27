import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildCycleReport } from "@/lib/reports";
import type { CycleReport } from "@/types/report";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const { id: cycleId } = params;
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

  try {
    const report = await buildCycleReport(cycleId, companyId);

    await writeAuditLog({
      companyId,
      userId: authResult.userId,
      action: "decryption",
      target: `cycle:${cycleId}`,
      metadata: { type: "cycle_report" },
    });

    return NextResponse.json<ApiResponse<CycleReport>>({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Cycle report error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
