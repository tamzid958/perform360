import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  avatar: z.string().url().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const user = await prisma.user.findFirst({
    where: {
      id: authResult.userId,
      companyId: authResult.companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      company: {
        select: { name: true },
      },
      teamMemberships: {
        select: {
          role: true,
          team: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      companyName: user.company.name,
      teams: user.teamMemberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
        role: m.role,
      })),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: authResult.userId },
      data: validated,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    // Keep AuthUser.name in sync so the NextAuth session reflects the change
    if (validated.name) {
      await prisma.authUser.updateMany({
        where: { email: user.email },
        data: { name: validated.name },
      });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
