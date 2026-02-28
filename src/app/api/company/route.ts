import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const company = await prisma.company.findUnique({
    where: { id: authResult.companyId },
    select: { id: true, name: true, slug: true, logo: true, settings: true },
  });

  if (!company) {
    return NextResponse.json({
      success: false,
      error: "Company not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: company });
}

export async function PATCH(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = updateCompanySchema.parse(body);

    if (validated.slug) {
      const existing = await prisma.company.findUnique({
        where: { slug: validated.slug },
      });
      if (existing && existing.id !== authResult.companyId) {
        return NextResponse.json({
          success: false,
          error: "This slug is already taken",
          code: "DUPLICATE",
        }, { status: 409 });
      }
    }

    const company = await prisma.company.update({
      where: { id: authResult.companyId },
      data: validated,
      select: { id: true, name: true, slug: true, logo: true, settings: true },
    });

    return NextResponse.json({ success: true, data: company });
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
