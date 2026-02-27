import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const createCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required"),
  templateId: z.string().min(1, "Template is required"),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid end date"),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const cycles = await prisma.evaluationCycle.findMany({
    where: {
      companyId: authResult.companyId,
      ...(status ? { status: status as "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED" } : {}),
    },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: cycles,
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

    // Verify template belongs to company or is global
    const template = await prisma.evaluationTemplate.findFirst({
      where: {
        id: validated.templateId,
        OR: [
          { companyId: authResult.companyId },
          { isGlobal: true },
        ],
      },
    });

    if (!template) {
      return NextResponse.json({
        success: false,
        error: "Template not found",
        code: "NOT_FOUND",
      }, { status: 404 });
    }

    const cycle = await prisma.evaluationCycle.create({
      data: {
        name: validated.name,
        companyId: authResult.companyId,
        templateId: validated.templateId,
        startDate,
        endDate,
        status: "DRAFT",
      },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: cycle,
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
