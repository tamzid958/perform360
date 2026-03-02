import { NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";
import { validateCuidParam } from "@/lib/validation";

type Params = { id: string };

export const POST = withSuperAdmin<Params>(async (_request, { params }) => {
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, encryptionSetupAt: true },
  });

  if (!company) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  if (!company.encryptionSetupAt) {
    return NextResponse.json(
      { success: false, error: "Encryption is not set up for this company" },
      { status: 400 }
    );
  }

  // Reset encryption fields and clean up related data
  await prisma.$transaction([
    // Reset company encryption to pre-setup state
    prisma.company.update({
      where: { id: params.id },
      data: {
        encryptionKeyEncrypted: "PLACEHOLDER_AWAITING_SETUP",
        encryptionSalt: null,
        encryptionSetupAt: null,
        keyVersion: 0,
      },
    }),
    // Delete all recovery codes
    prisma.recoveryCode.deleteMany({
      where: { companyId: params.id },
    }),
    // Clear cached data keys on all cycles (they're now invalid)
    prisma.evaluationCycle.updateMany({
      where: { companyId: params.id },
      data: { cachedDataKeyEncrypted: null },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { id: params.id, encryptionReset: true },
  });
});
