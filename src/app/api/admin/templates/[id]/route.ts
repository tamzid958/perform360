import { NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";
import { validateCuidParam } from "@/lib/validation";
import { z } from "zod";

type Params = { id: string };

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  type: z.enum(["rating_scale", "text", "multiple_choice", "yes_no", "competency_matrix"]),
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
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  sections: z.array(sectionSchema).min(1).optional(),
});

export const GET = withSuperAdmin<Params>(async (_request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const template = await prisma.evaluationTemplate.findFirst({
    where: { id: params.id, isGlobal: true, companyId: null },
  });

  if (!template) {
    return NextResponse.json(
      { success: false, error: "Global template not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: template });
});

export const PATCH = withSuperAdmin<Params>(async (request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const body = await request.json();
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.evaluationTemplate.findFirst({
    where: { id: params.id, isGlobal: true, companyId: null },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Global template not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.evaluationTemplate.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.sections !== undefined && {
        sections: parsed.data.sections as unknown as import("@prisma/client").Prisma.InputJsonValue,
      }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = withSuperAdmin<Params>(async (_request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const template = await prisma.evaluationTemplate.findFirst({
    where: { id: params.id, isGlobal: true, companyId: null },
  });

  if (!template) {
    return NextResponse.json(
      { success: false, error: "Global template not found" },
      { status: 404 }
    );
  }

  const inUse = await prisma.evaluationCycle.count({
    where: { templateId: params.id },
  });

  if (inUse > 0) {
    return NextResponse.json(
      { success: false, error: `Template is used by ${inUse} evaluation cycle(s) and cannot be deleted` },
      { status: 409 }
    );
  }

  await prisma.evaluationTemplate.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, data: { id: params.id } });
});
