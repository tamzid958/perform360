import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";

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

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sections: z.array(sectionSchema).min(1).optional(),
});

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

  const template = await prisma.evaluationTemplate.findFirst({
    where: {
      id: params.id,
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

  return NextResponse.json({
    success: true,
    data: template,
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
    const validated = updateTemplateSchema.parse(body);

    // Only company-owned templates can be edited (not global)
    const existing = await prisma.evaluationTemplate.findFirst({
      where: {
        id: params.id,
        companyId: authResult.companyId,
        isGlobal: false,
      },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: "Template not found or cannot be edited",
        code: "NOT_FOUND",
      }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.sections) updateData.sections = JSON.parse(JSON.stringify(validated.sections));

    const template = await prisma.evaluationTemplate.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: template,
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

  const template = await prisma.evaluationTemplate.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
      isGlobal: false,
    },
  });

  if (!template) {
    return NextResponse.json({
      success: false,
      error: "Template not found or cannot be deleted",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  // Check if template is used in active cycles
  const activeCycleCount = await prisma.cycleTeam.count({
    where: {
      templateId: params.id,
      cycle: { status: { in: ["ACTIVE", "CLOSED"] } },
    },
  });

  if (activeCycleCount > 0) {
    return NextResponse.json({
      success: false,
      error: "Cannot delete template used in active or closed cycles",
      code: "IN_USE",
    }, { status: 400 });
  }

  await prisma.evaluationTemplate.delete({
    where: { id: params.id },
  });

  return NextResponse.json({
    success: true,
    data: { deleted: true },
  });
}
