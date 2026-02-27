import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAssignmentsForCycle } from "@/lib/assignments";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";

const relationshipWeightsSchema = z.object({
  manager: z.number().min(0).max(100),
  peer: z.number().min(0).max(100),
  directReport: z.number().min(0).max(100),
  self: z.number().min(0).max(100),
  external: z.number().min(0).max(100),
}).refine(
  (w) => Math.abs(w.manager + w.peer + w.directReport + w.self + w.external - 100) < 0.01,
  { message: "Weights must sum to 100%" }
);

const levelTemplateSchema = z.object({
  levelId: z.string().min(1),
  relationship: z.enum(["manager", "direct_report", "peer", "self", "external"]).nullable().optional().default(null),
  templateId: z.string().min(1),
});

const relationshipTemplateSchema = z.object({
  relationship: z.enum(["manager", "direct_report", "peer", "self", "external"]),
  templateId: z.string().min(1),
});

const teamTemplateSchema = z.object({
  teamId: z.string().min(1),
  templateId: z.string().optional(),
  weightPreset: z.enum(["equal", "supervisor_focus", "peer_focus", "custom"]).optional(),
  weights: relationshipWeightsSchema.optional(),
  managerWeights: relationshipWeightsSchema.optional(),
  levelTemplates: z.array(levelTemplateSchema).optional(),
  relationshipTemplates: z.array(relationshipTemplateSchema).optional(),
}).refine(
  (tt) =>
    tt.templateId ||
    (tt.levelTemplates && tt.levelTemplates.length > 0) ||
    (tt.relationshipTemplates && tt.relationshipTemplates.length > 0),
  { message: "Either templateId, levelTemplates, or relationshipTemplates required" }
);

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
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const { id } = await params;
  const invalid = validateCuidParam(id);
  if (invalid) return invalid;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  // Parallel: cycle metadata + assignment status counts (lightweight)
  const [cycle, assignmentCounts] = await Promise.all([
    prisma.evaluationCycle.findFirst({
      where: {
        id,
        companyId: authResult.companyId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        cycleTeams: {
          include: {
            team: { select: { id: true, name: true } },
            template: { select: { id: true, name: true } },
            levelTemplates: {
              include: {
                level: { select: { id: true, name: true } },
                template: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.evaluationAssignment.groupBy({
      by: ["status"],
      where: { cycleId: id },
      _count: true,
    }),
  ]);

  if (!cycle) {
    return NextResponse.json({
      success: false,
      error: "Cycle not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  // Compute stats from grouped counts (no need to fetch all assignments)
  const statusCounts: Record<string, number> = {};
  for (const g of assignmentCounts) {
    statusCounts[g.status] = g._count;
  }
  const totalAssignments = Object.values(statusCounts).reduce((s, c) => s + c, 0);
  const submittedAssignments = statusCounts["SUBMITTED"] ?? 0;
  const inProgressAssignments = statusCounts["IN_PROGRESS"] ?? 0;
  const pendingAssignments = statusCounts["PENDING"] ?? 0;
  const completionRate = totalAssignments > 0
    ? Math.round((submittedAssignments / totalAssignments) * 100)
    : 0;

  const teamTemplates = cycle.cycleTeams.map((ct) => ({
    teamId: ct.team.id,
    teamName: ct.team.name,
    templateId: ct.template?.id ?? null,
    templateName: ct.template?.name ?? null,
    weightPreset: ct.weightPreset ?? null,
    weights: ct.weightManager !== null
      ? {
          manager: Math.round(ct.weightManager * 100),
          peer: Math.round(ct.weightPeer! * 100),
          directReport: Math.round(ct.weightDirectReport! * 100),
          self: Math.round(ct.weightSelf! * 100),
          external: Math.round(ct.weightExternal! * 100),
        }
      : null,
    managerWeights: ct.mgrWeightManager !== null
      ? {
          manager: Math.round(ct.mgrWeightManager * 100),
          peer: Math.round(ct.mgrWeightPeer! * 100),
          directReport: Math.round(ct.mgrWeightDirectReport! * 100),
          self: Math.round(ct.mgrWeightSelf! * 100),
          external: Math.round(ct.mgrWeightExternal! * 100),
        }
      : null,
    levelTemplates: ((ct as any).levelTemplates ?? []).map((lt: any) => ({
      levelId: lt.level.id,
      levelName: lt.level.name,
      relationship: lt.relationship,
      templateId: lt.template.id,
      templateName: lt.template.name,
    })),
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
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const { id } = await params;
  const invalid = validateCuidParam(id);
  if (invalid) return invalid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = updateCycleSchema.parse(body);

    const existing = await prisma.evaluationCycle.findFirst({
      where: {
        id,
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

      // Collect all template IDs (default + level-specific + relationship-only)
      const allTemplateIds = new Set<string>();
      for (const tt of validated.teamTemplates) {
        if (tt.templateId) allTemplateIds.add(tt.templateId);
        if (tt.levelTemplates) {
          for (const lt of tt.levelTemplates) allTemplateIds.add(lt.templateId);
        }
        if (tt.relationshipTemplates) {
          for (const rt of tt.relationshipTemplates) allTemplateIds.add(rt.templateId);
        }
      }
      const templateIds = Array.from(allTemplateIds);
      if (templateIds.length > 0) {
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

      // Verify all level IDs belong to company
      const allLevelIds = new Set<string>();
      for (const tt of validated.teamTemplates) {
        if (tt.levelTemplates) {
          for (const lt of tt.levelTemplates) allLevelIds.add(lt.levelId);
        }
      }
      if (allLevelIds.size > 0) {
        const levels = await prisma.level.findMany({
          where: { id: { in: Array.from(allLevelIds) }, companyId: authResult.companyId },
          select: { id: true },
        });
        if (levels.length !== allLevelIds.size) {
          return NextResponse.json({
            success: false,
            error: "One or more levels not found",
            code: "NOT_FOUND",
          }, { status: 404 });
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.status) updateData.status = validated.status;
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);

    const _cycle = await prisma.$transaction(async (tx) => {
      const updated = await tx.evaluationCycle.update({
        where: { id },
        data: updateData,
      });

      // Replace CycleTeam entries and regenerate assignments if teamTemplates changed
      if (validated.teamTemplates) {
        await tx.evaluationAssignment.deleteMany({ where: { cycleId: id } });
        await tx.cycleTeam.deleteMany({ where: { cycleId: id } });

        for (const tt of validated.teamTemplates) {
          const cycleTeam = await tx.cycleTeam.create({
            data: {
              cycleId: id,
              teamId: tt.teamId,
              templateId: tt.templateId ?? null,
              weightPreset: tt.weightPreset ?? null,
              weightManager: tt.weights ? tt.weights.manager / 100 : null,
              weightPeer: tt.weights ? tt.weights.peer / 100 : null,
              weightDirectReport: tt.weights ? tt.weights.directReport / 100 : null,
              weightSelf: tt.weights ? tt.weights.self / 100 : null,
              weightExternal: tt.weights ? tt.weights.external / 100 : null,
              mgrWeightManager: tt.managerWeights ? tt.managerWeights.manager / 100 : null,
              mgrWeightPeer: tt.managerWeights ? tt.managerWeights.peer / 100 : null,
              mgrWeightDirectReport: tt.managerWeights ? tt.managerWeights.directReport / 100 : null,
              mgrWeightSelf: tt.managerWeights ? tt.managerWeights.self / 100 : null,
              mgrWeightExternal: tt.managerWeights ? tt.managerWeights.external / 100 : null,
            },
          });

          if (tt.levelTemplates && tt.levelTemplates.length > 0) {
            await tx.cycleTeamLevelTemplate.createMany({
              data: tt.levelTemplates.map((lt) => ({
                cycleTeamId: cycleTeam.id,
                levelId: lt.levelId,
                relationship: lt.relationship ?? null,
                templateId: lt.templateId,
              })),
            });
          }

          if (tt.relationshipTemplates && tt.relationshipTemplates.length > 0) {
            await tx.cycleTeamLevelTemplate.createMany({
              data: tt.relationshipTemplates.map((rt) => ({
                cycleTeamId: cycleTeam.id,
                levelId: null,
                relationship: rt.relationship,
                templateId: rt.templateId,
              })),
            });
          }
        }
      }

      return updated;
    });

    // Regenerate assignments outside the transaction if teamTemplates changed
    if (validated.teamTemplates) {
      await createAssignmentsForCycle(
        id,
        authResult.companyId,
        validated.teamTemplates
      );
    }

    const cycleWithRelations = await prisma.evaluationCycle.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { assignments: true } },
        cycleTeams: {
          include: {
            team: { select: { id: true, name: true } },
            template: { select: { id: true, name: true } },
            levelTemplates: {
              include: {
                level: { select: { id: true, name: true } },
                template: { select: { id: true, name: true } },
              },
            },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const { id } = await params;
  const invalid = validateCuidParam(id);
  if (invalid) return invalid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const cycle = await prisma.evaluationCycle.findFirst({
    where: {
      id,
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
    prisma.otpSession.deleteMany({
      where: { assignment: { cycleId: id } },
    }),
    prisma.evaluationResponse.deleteMany({
      where: { assignment: { cycleId: id } },
    }),
    prisma.evaluationAssignment.deleteMany({
      where: { cycleId: id },
    }),
    prisma.cycleTeam.deleteMany({
      where: { cycleId: id },
    }),
    prisma.evaluationCycle.delete({
      where: { id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { deleted: true },
  });
}
