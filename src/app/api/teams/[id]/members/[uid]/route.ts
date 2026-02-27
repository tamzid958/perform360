import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; uid: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  // Verify team belongs to company
  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
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
        userId: params.uid,
        teamId: params.id,
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
