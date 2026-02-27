import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const updateCycleSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date").optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid end date").optional(),
});

/** Valid cycle status transitions */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const cycle = await prisma.evaluationCycle.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
    include: {
      assignments: {
        select: {
          id: true,
          subjectId: true,
          reviewerId: true,
          relationship: true,
          status: true,
          _count: { select: { responses: true } },
        },
      },
      _count: {
        select: { assignments: true },
      },
    },
  });

  // Resolve subject/reviewer names for assignments
  if (cycle) {
    const userIds = new Set<string>();
    for (const a of cycle.assignments) {
      userIds.add(a.subjectId);
      userIds.add(a.reviewerId);
    }
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(users.map((u) => [u.id, u.name]));
    // Attach names to cycle object for response
    (cycle as Record<string, unknown>).assignmentsWithNames = cycle.assignments.map((a) => ({
      ...a,
      subjectName: nameMap.get(a.subjectId) ?? "Unknown",
      reviewerName: nameMap.get(a.reviewerId) ?? "Unknown",
    }));
  }

  if (!cycle) {
    return NextResponse.json({
      success: false,
      error: "Cycle not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  const totalAssignments = cycle.assignments.length;
  const submittedAssignments = cycle.assignments.filter(
    (a) => a.status === "SUBMITTED"
  ).length;
  const inProgressAssignments = cycle.assignments.filter(
    (a) => a.status === "IN_PROGRESS"
  ).length;
  const pendingAssignments = cycle.assignments.filter(
    (a) => a.status === "PENDING"
  ).length;
  const completionRate = totalAssignments > 0
    ? Math.round((submittedAssignments / totalAssignments) * 100)
    : 0;

  // Fetch template name
  const template = await prisma.evaluationTemplate.findUnique({
    where: { id: cycle.templateId },
    select: { name: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...cycle,
      templateName: template?.name ?? "Unknown Template",
      stats: {
        totalAssignments,
        submittedAssignments,
        inProgressAssignments,
        pendingAssignments,
        completionRate,
      },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = updateCycleSchema.parse(body);

    const existing = await prisma.evaluationCycle.findFirst({
      where: {
        id: params.id,
        companyId: authResult.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: "Cycle not found",
        code: "NOT_FOUND",
      }, { status: 404 });
    }

    // Validate status transition
    if (validated.status && validated.status !== existing.status) {
      if (!isValidTransition(existing.status, validated.status)) {
        return NextResponse.json({
          success: false,
          error: `Cannot transition from ${existing.status} to ${validated.status}. Use the activate endpoint for DRAFT → ACTIVE.`,
          code: "INVALID_STATUS",
        }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.status) updateData.status = validated.status;
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);

    const cycle = await prisma.evaluationCycle.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: cycle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const cycle = await prisma.evaluationCycle.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!cycle) {
    return NextResponse.json({
      success: false,
      error: "Cycle not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  if (cycle.status !== "DRAFT") {
    return NextResponse.json({
      success: false,
      error: "Only DRAFT cycles can be deleted",
      code: "INVALID_STATUS",
    }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.evaluationAssignment.deleteMany({
      where: { cycleId: params.id },
    }),
    prisma.evaluationCycle.delete({
      where: { id: params.id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { deleted: true },
  });
}
