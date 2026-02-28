import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).optional(),
  logo: z.string().url().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withSuperAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = searchParams.get("search")?.trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        encryptionSetupAt: true,
        keyVersion: true,
        _count: {
          select: {
            users: true,
            teams: true,
            cycles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  const enriched = companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    logo: c.logo,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    encryptionConfigured: c.encryptionSetupAt !== null,
    keyVersion: c.keyVersion,
    userCount: c._count.users,
    teamCount: c._count.teams,
    cycleCount: c._count.cycles,
  }));

  return NextResponse.json({
    success: true,
    data: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = withSuperAdmin(async (request) => {
  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, slug: rawSlug, logo, settings } = parsed.data;
  const slug = rawSlug ?? slugify(name);

  const existing = await prisma.company.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A company with this slug already exists" },
      { status: 409 }
    );
  }

  const company = await prisma.company.create({
    data: {
      name,
      slug,
      logo: logo ?? null,
      settings: settings ? (settings as Prisma.InputJsonValue) : Prisma.JsonNull,
      encryptionKeyEncrypted: "",
      keyVersion: 1,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: company }, { status: 201 });
});
