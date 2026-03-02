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

const teamTemplateSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  templateId: z.string().min(1, "Template ID is required"),
  weights: relationshipWeightsSchema.optional(),
});

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

  return NextResponse.json({
    success: true,
    data: cycles,
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

    // Verify all templates belong to company or are global
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

    // Create cycle and CycleTeam rows in a transaction
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

      await tx.cycleTeam.createMany({
        data: validated.teamTemplates.map((tt) => ({
          cycleId: created.id,
          teamId: tt.teamId,
          templateId: tt.templateId,
          weightManager: tt.weights ? tt.weights.manager / 100 : null,
          weightPeer: tt.weights ? tt.weights.peer / 100 : null,
          weightDirectReport: tt.weights ? tt.weights.directReport / 100 : null,
          weightSelf: tt.weights ? tt.weights.self / 100 : null,
          weightExternal: tt.weights ? tt.weights.external / 100 : null,
        })),
      });

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
