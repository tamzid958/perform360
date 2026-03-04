import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAssignmentsForCycle } from "@/lib/assignments";
import { applyRateLimit } from "@/lib/rate-limit";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/utils";
import type { CycleStatus } from "@prisma/client";

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
  levelId: z.string().min(1, "Level ID is required"),
  relationship: z.enum(["manager", "direct_report", "peer", "self", "external"]),
  templateId: z.string().min(1, "Template ID is required"),
});

const relationshipTemplateSchema = z.object({
  relationship: z.enum(["manager", "direct_report", "peer", "self", "external"]),
  templateId: z.string().min(1, "Template ID is required"),
});

const teamTemplateSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  templateId: z.string().optional(), // optional when using per-level or relationship templates
  weights: relationshipWeightsSchema.optional(),
  levelTemplates: z.array(levelTemplateSchema).optional(),
  relationshipTemplates: z.array(relationshipTemplateSchema).optional(),
}).refine(
  (tt) =>
    tt.templateId ||
    (tt.levelTemplates && tt.levelTemplates.length > 0) ||
    (tt.relationshipTemplates && tt.relationshipTemplates.length > 0),
  { message: "Either templateId, levelTemplates, or relationshipTemplates must be provided" }
);

const createCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required"),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid end date"),
  teamTemplates: z.array(teamTemplateSchema).min(1, "At least one team-template pair is required"),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const { page, limit, search } = parsePaginationParams(searchParams, 12);
  const statusParam = searchParams.get("status");

  const statusFilter: { status?: CycleStatus | { in: CycleStatus[] } } = {};
  if (statusParam) {
    const statuses = statusParam.split(",") as CycleStatus[];
    statusFilter.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }

  const where = {
    companyId: authResult.companyId,
    ...statusFilter,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [cycles, total] = await Promise.all([
    prisma.evaluationCycle.findMany({
      where,
      include: {
        _count: {
          select: { assignments: true },
        },
        assignments: {
          select: { status: true },
        },
        cycleTeams: {
          include: {
            team: { select: { id: true, name: true } },
            template: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evaluationCycle.count({ where }),
  ]);

  const cyclesWithCounts = cycles.map(({ assignments, ...cycle }) => ({
    ...cycle,
    submittedCount: assignments.filter((a) => a.status === "SUBMITTED").length,
    pendingCount: assignments.filter((a) => a.status !== "SUBMITTED").length,
  }));

  return NextResponse.json({
    success: true,
    data: cyclesWithCounts,
    pagination: buildPaginationMeta(page, limit, total),
  });
}

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = createCycleSchema.parse(body);

    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    if (endDate <= startDate) {
      return NextResponse.json({
        success: false,
        error: "End date must be after start date",
        code: "VALIDATION_ERROR",
      }, { status: 400 });
    }

    // Check for duplicate teamIds
    const teamIds = validated.teamTemplates.map((tt) => tt.teamId);
    if (new Set(teamIds).size !== teamIds.length) {
      return NextResponse.json({
        success: false,
        error: "Duplicate teams are not allowed",
        code: "VALIDATION_ERROR",
      }, { status: 400 });
    }

    // Verify all teams belong to the company
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

    // Verify all templates belong to company or are global
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

    // Verify all level IDs (if any) belong to company
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

    // Create cycle, CycleTeam rows, and level template overrides in a transaction
    const cycle = await prisma.$transaction(async (tx) => {
      const created = await tx.evaluationCycle.create({
        data: {
          name: validated.name,
          companyId: authResult.companyId,
          startDate,
          endDate,
          status: "DRAFT",
        },
      });

      // Create CycleTeam records
      for (const tt of validated.teamTemplates) {
        const cycleTeam = await tx.cycleTeam.create({
          data: {
            cycleId: created.id,
            teamId: tt.teamId,
            templateId: tt.templateId ?? null,
            weightManager: tt.weights ? tt.weights.manager / 100 : null,
            weightPeer: tt.weights ? tt.weights.peer / 100 : null,
            weightDirectReport: tt.weights ? tt.weights.directReport / 100 : null,
            weightSelf: tt.weights ? tt.weights.self / 100 : null,
            weightExternal: tt.weights ? tt.weights.external / 100 : null,
          },
        });

        // Create per-level template overrides if provided
        if (tt.levelTemplates && tt.levelTemplates.length > 0) {
          await tx.cycleTeamLevelTemplate.createMany({
            data: tt.levelTemplates.map((lt) => ({
              cycleTeamId: cycleTeam.id,
              levelId: lt.levelId,
              relationship: lt.relationship,
              templateId: lt.templateId,
            })),
          });
        }

        // Create relationship-only template overrides (no level) if provided
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

      return created;
    });

    // Generate assignments from team structure while still in DRAFT
    const { count } = await createAssignmentsForCycle(
      cycle.id,
      authResult.companyId,
      validated.teamTemplates
    );

    const cycleWithRelations = await prisma.evaluationCycle.findUniqueOrThrow({
      where: { id: cycle.id },
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
      data: { ...cycleWithRelations, assignmentsCreated: count },
    }, { status: 201 });
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
