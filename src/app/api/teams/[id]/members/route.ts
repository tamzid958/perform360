import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";

const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["MANAGER", "MEMBER", "EXTERNAL"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const { id } = await params;
  const invalid = validateCuidParam(id);
  if (invalid) return invalid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = addMemberSchema.parse(body);

    // Verify team belongs to company
    const team = await prisma.team.findFirst({
      where: {
        id: id,
        companyId: authResult.companyId,
      },
    });

    if (!team) {
      return NextResponse.json({
        success: false,
        error: "Team not found",
        code: "NOT_FOUND",
      }, { status: 404 });
    }

    // Verify user belongs to same company
    const user = await prisma.user.findFirst({
      where: {
        id: validated.userId,
        companyId: authResult.companyId,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found in company",
        code: "NOT_FOUND",
      }, { status: 404 });
    }

    // Check for existing membership
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: validated.userId,
          teamId: id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({
        success: false,
        error: "User is already a member of this team",
        code: "DUPLICATE",
      }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: validated.userId,
        teamId: id,
        role: validated.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: member,
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
