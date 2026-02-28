import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const questionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(["rating_scale", "text", "multiple_choice"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleLabels: z.array(z.string()).optional(),
  conditionalOn: z.string().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  sections: z.array(sectionSchema).min(1, "At least one section is required"),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const { page, limit, search } = parsePaginationParams(searchParams, 12);
  const scope = searchParams.get("scope"); // "global" | "company" | null (all)

  const scopeFilter: Prisma.EvaluationTemplateWhereInput =
    scope === "global"
      ? { isGlobal: true }
      : scope === "company"
        ? { companyId: authResult.companyId, isGlobal: false }
        : { OR: [{ companyId: authResult.companyId }, { isGlobal: true }] };

  const where: Prisma.EvaluationTemplateWhereInput = {
    AND: [
      scopeFilter,
      ...(search
        ? [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { description: { contains: search, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const [templates, total] = await Promise.all([
    prisma.evaluationTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evaluationTemplate.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: templates,
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
    const validated = createTemplateSchema.parse(body);

    const template = await prisma.evaluationTemplate.create({
      data: {
        name: validated.name,
        description: validated.description,
        sections: JSON.parse(JSON.stringify(validated.sections)),
        companyId: authResult.companyId,
        createdBy: authResult.userId,
        isGlobal: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
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
