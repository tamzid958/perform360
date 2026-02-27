import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const company = await prisma.company.findUnique({
    where: { id: authResult.companyId },
    select: { encryptionSetupAt: true, keyVersion: true },
  });

  if (!company) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  const remainingRecoveryCodes = await prisma.recoveryCode.count({
    where: { companyId: authResult.companyId, usedAt: null },
  });

  return NextResponse.json({
    success: true,
    data: {
      isSetup: company.encryptionSetupAt !== null,
      setupAt: company.encryptionSetupAt,
      keyVersion: company.keyVersion,
      remainingRecoveryCodes,
    },
  });
}
