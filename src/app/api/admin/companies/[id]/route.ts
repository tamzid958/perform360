import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";
import { validateCuidParam } from "@/lib/validation";
import { cascadeDeleteCompany } from "@/lib/company-cascade-delete";
import { z } from "zod";

type Params = { id: string };

const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).optional(),
  logo: z.string().url().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const GET = withSuperAdmin<Params>(async (_request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
      encryptionSetupAt: true,
      keyVersion: true,
      _count: {
        select: {
          users: true,
          teams: true,
          cycles: true,
          templates: true,
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...company,
      encryptionConfigured: company.encryptionSetupAt !== null,
      userCount: company._count.users,
      teamCount: company._count.teams,
      cycleCount: company._count.cycles,
      templateCount: company._count.templates,
      _count: undefined,
      encryptionSetupAt: undefined,
    },
  });
});

export const PATCH = withSuperAdmin<Params>(async (request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const body = await request.json();
  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.company.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const slugTaken = await prisma.company.findUnique({ where: { slug: parsed.data.slug } });
    if (slugTaken) {
      return NextResponse.json(
        { success: false, error: "A company with this slug already exists" },
        { status: 409 }
      );
    }
  }

  const updateData: Prisma.CompanyUpdateInput = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
  if (parsed.data.logo !== undefined) updateData.logo = parsed.data.logo;
  if (parsed.data.settings !== undefined) {
    updateData.settings = parsed.data.settings === null
      ? Prisma.JsonNull
      : parsed.data.settings as Prisma.InputJsonValue;
  }

  const updated = await prisma.company.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      settings: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = withSuperAdmin<Params>(async (_request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      _count: { select: { cycles: { where: { status: "ACTIVE" } } } },
    },
  });

  if (!company) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  if (company._count.cycles > 0) {
    return NextResponse.json(
      { success: false, error: "Cannot delete a company with active evaluation cycles" },
      { status: 409 }
    );
  }

  await cascadeDeleteCompany(params.id);

  return NextResponse.json({ success: true, data: { id: params.id } });
});
