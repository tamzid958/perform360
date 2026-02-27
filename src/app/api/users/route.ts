import { NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const users = await prisma.user.findMany({
    where: { companyId: authResult.companyId },
    include: {
      teamMemberships: {
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: users,
  });
}
