import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const { id, uid } = await params;
  const invalidId = validateCuidParam(id, "teamId");
  if (invalidId) return invalidId;
  const invalidUid = validateCuidParam(uid, "userId");
  if (invalidUid) return invalidUid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

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

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: uid,
        teamId: id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({
      success: false,
      error: "Team member not found",
      code: "NOT_FOUND",
    }, { status: 404 });
  }

  await prisma.teamMember.delete({
    where: { id: membership.id },
  });

  return NextResponse.json({
    success: true,
    data: { deleted: true },
  });
}
