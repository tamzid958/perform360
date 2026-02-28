import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAssignmentsForCycle } from "@/lib/assignments";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";

const teamTemplateSchema = z.object({
  teamId: z.string().min(1),
  templateId: z.string().min(1),
});

const updateCycleSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date").optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid end date").optional(),
  teamTemplates: z.array(teamTemplateSchema).min(1).optional(),
});

/** Valid cycle status transitions */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["CLOSED"],
  CLOSED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

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
          templateId: true,
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
      cycleTeams: {
        include: {
          team: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Resolve subject/reviewer names + team info for assignments
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

    // Build templateId -> team mapping from cycleTeams
    // If multiple teams share the same template, fetch membership to disambiguate
    const templateToTeams = new Map<string, { teamId: string; teamName: string }[]>();
    for (const ct of cycle.cycleTeams) {
      const arr = templateToTeams.get(ct.template.id) ?? [];
      arr.push({ teamId: ct.team.id, teamName: ct.team.name });
      templateToTeams.set(ct.template.id, arr);
    }

    // Fetch team memberships only if disambiguation needed
    const needsDisambiguation = Array.from(templateToTeams.values()).some((t) => t.length > 1);
    let userTeamMap: Map<string, Set<string>> | null = null;
    if (needsDisambiguation) {
      const teamIds = cycle.cycleTeams.map((ct) => ct.team.id);
      const memberships = await prisma.teamMember.findMany({
        where: { teamId: { in: teamIds } },
        select: { userId: true, teamId: true },
      });
      userTeamMap = new Map<string, Set<string>>();
      for (const m of memberships) {
        const set = userTeamMap.get(m.userId) ?? new Set<string>();
        set.add(m.teamId);
        userTeamMap.set(m.userId, set);
      }
    }

    // Attach names + team to cycle object for response
    (cycle as Record<string, unknown>).assignmentsWithNames = cycle.assignments.map((a) => {
      const teams = templateToTeams.get(a.templateId) ?? [];
      let team = teams[0] ?? { teamId: "", teamName: "Unknown" };
      if (teams.length > 1 && userTeamMap) {
        const subjectTeams = userTeamMap.get(a.subjectId);
        const match = teams.find((t) => subjectTeams?.has(t.teamId));
        if (match) team = match;
      }
      return {
        ...a,
        subjectName: nameMap.get(a.subjectId) ?? "Unknown",
        reviewerName: nameMap.get(a.reviewerId) ?? "Unknown",
        teamId: team.teamId,
        teamName: team.teamName,
      };
    });
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

  const teamTemplates = cycle.cycleTeams.map((ct) => ({
    teamId: ct.team.id,
    teamName: ct.team.name,
    templateId: ct.template.id,
    templateName: ct.template.name,
  }));

  return NextResponse.json({
    success: true,
    data: {
      ...cycle,
      teamTemplates,
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
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

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

    // Validate teamTemplates can only be changed in DRAFT
    if (validated.teamTemplates && existing.status !== "DRAFT") {
      return NextResponse.json({
        success: false,
        error: "Team-template assignments can only be changed while cycle is in DRAFT",
        code: "INVALID_STATUS",
      }, { status: 400 });
    }

    // Validate team-template pairs if provided
    if (validated.teamTemplates) {
      const teamIds = validated.teamTemplates.map((tt) => tt.teamId);
      if (new Set(teamIds).size !== teamIds.length) {
        return NextResponse.json({
          success: false,
          error: "Duplicate teams are not allowed",
          code: "VALIDATION_ERROR",
        }, { status: 400 });
      }

      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds }, companyId: authResult.companyId },
        select: { id: true },
      });
      if (teams.length !== teamIds.length) {
        return NextResponse.json({
          success: false,
          error: "One or more teams not found",
          code: "NOT_FOUND",
        }, { status: 404 });
      }

      const templateIds = Array.from(new Set(validated.teamTemplates.map((tt) => tt.templateId)));
      const templates = await prisma.evaluationTemplate.findMany({
        where: {
          id: { in: templateIds },
          OR: [
            { companyId: authResult.companyId },
            { isGlobal: true },
          ],
        },
        select: { id: true },
      });
      if (templates.length !== templateIds.length) {
        return NextResponse.json({
          success: false,
          error: "One or more templates not found",
          code: "NOT_FOUND",
        }, { status: 404 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.status) updateData.status = validated.status;
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);

    const cycle = await prisma.$transaction(async (tx) => {
      const updated = await tx.evaluationCycle.update({
        where: { id: params.id },
        data: updateData,
      });

      // Replace CycleTeam entries and regenerate assignments if teamTemplates changed
      if (validated.teamTemplates) {
        await tx.evaluationAssignment.deleteMany({ where: { cycleId: params.id } });
        await tx.cycleTeam.deleteMany({ where: { cycleId: params.id } });
        await tx.cycleTeam.createMany({
          data: validated.teamTemplates.map((tt) => ({
            cycleId: params.id,
            teamId: tt.teamId,
            templateId: tt.templateId,
          })),
        });
      }

      return updated;
    });

    // Regenerate assignments outside the transaction if teamTemplates changed
    if (validated.teamTemplates) {
      await createAssignmentsForCycle(
        params.id,
        authResult.companyId,
        validated.teamTemplates
      );
    }

    const cycleWithRelations = await prisma.evaluationCycle.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        _count: { select: { assignments: true } },
        cycleTeams: {
          include: {
            team: { select: { id: true, name: true } },
            template: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: cycleWithRelations,
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

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
    prisma.cycleTeam.deleteMany({
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
