import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deriveKey,
  generateSalt,
  decryptDataKey,
  encryptDataKey,
} from "@/lib/encryption";
import { ENCRYPTION_CONFIG } from "@/lib/constants";
import { applyRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const changeSchema = z
  .object({
    currentPassphrase: z.string().min(1, "Current passphrase is required"),
    newPassphrase: z
      .string()
      .min(ENCRYPTION_CONFIG.minPassphraseLength, `New passphrase must be at least ${ENCRYPTION_CONFIG.minPassphraseLength} characters`)
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
    const parsed = changeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassphrase, newPassphrase } = parsed.data;

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

    const oldSaltBuffer = Buffer.from(company.encryptionSalt, "base64");
    const oldMasterKey = deriveKey(currentPassphrase, oldSaltBuffer);

    let dataKey: Buffer;
    try {
      dataKey = decryptDataKey(company.encryptionKeyEncrypted, oldMasterKey);
    } catch {
      return NextResponse.json(
        { success: false, error: "Incorrect current passphrase" },
        { status: 400 }
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

      // Recovery codes are encrypted with scrypt(code, old_salt).
      // After salt rotation they become unrecoverable — delete them
      // so the admin is forced to regenerate.
      await tx.recoveryCode.deleteMany({
        where: { companyId: authResult.companyId },
      });
    });

    await writeAuditLog({
      companyId: authResult.companyId,
      userId: authResult.userId,
      action: "encryption_passphrase_change",
    });

    return NextResponse.json({
      success: true,
      data: { recoveryCodesInvalidated: true },
    });
  } catch (error) {
    console.error("Change passphrase error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change passphrase" },
      { status: 500 }
    );
  }
}
