import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "HR", "MANAGER", "MEMBER"]).optional(),
  name: z.string().min(1).optional(),
});

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
    const validated = updateUserSchema.parse(body);

    // Only ADMINs can change roles to/from ADMIN
    if (validated.role === "ADMIN" && authResult.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Only admins can assign the ADMIN role",
        code: "FORBIDDEN",
      }, { status: 403 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId: authResult.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: "User not found",
        code: "NOT_FOUND",
      }, { status: 404 });
    }

    // Prevent demoting self from ADMIN
    if (existing.id === authResult.userId && existing.role === "ADMIN" && validated.role && validated.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Cannot demote yourself from ADMIN role",
        code: "FORBIDDEN",
      }, { status: 403 });
    }

    // Only ADMINs can modify other ADMINs
    if (existing.role === "ADMIN" && authResult.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Only admins can modify admin users",
        code: "FORBIDDEN",
      }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: validated,
    });

    if (validated.role && validated.role !== existing.role) {
      await writeAuditLog({
        companyId: authResult.companyId,
        userId: authResult.userId,
        action: "role_change",
        target: `user:${params.id}`,
        metadata: { oldRole: existing.role, newRole: validated.role },
      });
    }

    return NextResponse.json({
      success: true,
      data: user,
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

  const user = await prisma.user.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!user) {
    return NextResponse.json({
      success: false,
      error: "User not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  // Prevent deleting yourself
  if (user.id === authResult.userId) {
    return NextResponse.json({
      success: false,
      error: "Cannot delete your own account",
      code: "FORBIDDEN",
    }, { status: 403 });
  }

  // Only ADMINs can delete other ADMINs
  if (user.role === "ADMIN" && authResult.role !== "ADMIN") {
    return NextResponse.json({
      success: false,
      error: "Only admins can delete admin users",
      code: "FORBIDDEN",
    }, { status: 403 });
  }

  // Remove team memberships, then delete user
  await prisma.$transaction([
    prisma.teamMember.deleteMany({
      where: { userId: params.id },
    }),
    prisma.user.delete({
      where: { id: params.id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { deleted: true },
  });
}
