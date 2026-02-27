import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deriveKey,
  decryptDataKey,
  encryptDataKey,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/encryption";
import { ENCRYPTION_CONFIG } from "@/lib/constants";
import { applyRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const regenerateSchema = z.object({
  passphrase: z.string().min(1, "Passphrase is required"),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = regenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { passphrase } = parsed.data;

    const company = await prisma.company.findUnique({
      where: { id: authResult.companyId },
      select: {
        encryptionKeyEncrypted: true,
        encryptionSalt: true,
        encryptionSetupAt: true,
      },
    });

    if (!company || !company.encryptionSetupAt || !company.encryptionSalt) {
      return NextResponse.json(
        { success: false, error: "Encryption is not set up" },
        { status: 400 }
      );
    }

    const saltBuffer = Buffer.from(company.encryptionSalt, "base64");
    const masterKey = deriveKey(passphrase, saltBuffer);

    let dataKey: Buffer;
    try {
      dataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);
    } catch {
      return NextResponse.json(
        { success: false, error: "Incorrect passphrase" },
        { status: 400 }
      );
    }

    const codes = generateRecoveryCodes(ENCRYPTION_CONFIG.recoveryCodeCount);

    const codeRecords = await Promise.all(
      codes.map(async (code) => {
        const codeHash = await hashRecoveryCode(code);
        const codeDerivedKey = deriveKey(code.toUpperCase().replace(/-/g, ""), saltBuffer);
        const codeEncryptedDataKey = encryptDataKey(dataKey, codeDerivedKey);
        return { codeHash, encryptedDataKey: codeEncryptedDataKey };
      })
    );

    await prisma.$transaction(async (tx) => {
      await tx.recoveryCode.deleteMany({
        where: { companyId: authResult.companyId },
      });

      await tx.recoveryCode.createMany({
        data: codeRecords.map((record) => ({
          companyId: authResult.companyId,
          codeHash: record.codeHash,
          encryptedDataKey: record.encryptedDataKey,
        })),
      });
    });

    await writeAuditLog({
      companyId: authResult.companyId,
      userId: authResult.userId,
      action: "recovery_codes_regenerate",
    });

    return NextResponse.json({
      success: true,
      data: { recoveryCodes: codes },
    });
  } catch (error) {
    console.error("Regenerate recovery codes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate recovery codes" },
      { status: 500 }
    );
  }
}
