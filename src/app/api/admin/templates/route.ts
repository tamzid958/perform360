import { NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sections: z.array(sectionSchema).min(1),
});

export const GET = withSuperAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = searchParams.get("search")?.trim();

  const where = {
    isGlobal: true,
    companyId: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [templates, total] = await Promise.all([
    prisma.evaluationTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        sections: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evaluationTemplate.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: templates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = withSuperAdmin(async (request, { auth }) => {
  const body = await request.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const template = await prisma.evaluationTemplate.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sections: parsed.data.sections as unknown as import("@prisma/client").Prisma.InputJsonValue,
      isGlobal: true,
      companyId: null,
      createdBy: auth.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      sections: true,
      isGlobal: true,
      createdBy: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: template }, { status: 201 });
});
