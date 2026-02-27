import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deriveKey,
  generateSalt,
  decryptDataKey,
  encryptDataKey,
  verifyRecoveryCode,
} from "@/lib/encryption";
import { ENCRYPTION_CONFIG } from "@/lib/constants";
import { applyRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const recoverSchema = z
  .object({
    recoveryCode: z.string().min(1, "Recovery code is required"),
    newPassphrase: z
      .string()
      .min(ENCRYPTION_CONFIG.minPassphraseLength, `Passphrase must be at least ${ENCRYPTION_CONFIG.minPassphraseLength} characters`)
      .max(ENCRYPTION_CONFIG.maxPassphraseLength),
    confirmNewPassphrase: z.string(),
  })
  .refine((data) => data.newPassphrase === data.confirmNewPassphrase, {
    message: "Passphrases do not match",
    path: ["confirmNewPassphrase"],
  });

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = recoverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { recoveryCode, newPassphrase } = parsed.data;

    const company = await prisma.company.findUnique({
      where: { id: authResult.companyId },
      select: { encryptionSalt: true, encryptionSetupAt: true },
    });

    if (!company || !company.encryptionSetupAt || !company.encryptionSalt) {
      return NextResponse.json(
        { success: false, error: "Encryption is not set up" },
        { status: 400 }
      );
    }

    const unusedCodes = await prisma.recoveryCode.findMany({
      where: { companyId: authResult.companyId, usedAt: null },
    });

    if (unusedCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recovery codes remaining" },
        { status: 400 }
      );
    }

    let matchedCode: (typeof unusedCodes)[0] | null = null;
    for (const code of unusedCodes) {
      const isMatch = await verifyRecoveryCode(recoveryCode, code.codeHash);
      if (isMatch) {
        matchedCode = code;
        break;
      }
    }

    if (!matchedCode) {
      return NextResponse.json(
        { success: false, error: "Invalid recovery code" },
        { status: 400 }
      );
    }

    const saltBuffer = Buffer.from(company.encryptionSalt, "base64");
    const normalizedCode = recoveryCode.toUpperCase().replace(/-/g, "").trim();
    const codeDerivedKey = deriveKey(normalizedCode, saltBuffer);

    let dataKey: Buffer;
    try {
      dataKey = decryptDataKey(matchedCode.encryptedDataKey, codeDerivedKey);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to decrypt data key with recovery code" },
        { status: 500 }
      );
    }

    const newSalt = generateSalt();
    const newSaltBuffer = Buffer.from(newSalt, "base64");
    const newMasterKey = deriveKey(newPassphrase, newSaltBuffer);
    const newEncryptedDataKey = encryptDataKey(dataKey, newMasterKey);

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: authResult.companyId },
        data: {
          encryptionKeyEncrypted: newEncryptedDataKey,
          encryptionSalt: newSalt,
        },
      });

      await tx.recoveryCode.update({
        where: { id: matchedCode.id },
        data: { usedAt: new Date() },
      });
    });

    await writeAuditLog({
      companyId: authResult.companyId,
      userId: authResult.userId,
      action: "encryption_recovery",
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Recovery error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to recover encryption" },
      { status: 500 }
    );
  }
}
