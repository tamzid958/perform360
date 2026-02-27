import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deriveKey,
  generateDataKey,
  generateSalt,
  encryptDataKey,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/encryption";
import { ENCRYPTION_CONFIG } from "@/lib/constants";

const setupSchema = z
  .object({
    passphrase: z
      .string()
      .min(ENCRYPTION_CONFIG.minPassphraseLength, `Passphrase must be at least ${ENCRYPTION_CONFIG.minPassphraseLength} characters`)
      .max(ENCRYPTION_CONFIG.maxPassphraseLength),
    confirmPassphrase: z.string(),
  })
  .refine((data) => data.passphrase === data.confirmPassphrase, {
    message: "Passphrases do not match",
    path: ["confirmPassphrase"],
  });

export async function POST(request: NextRequest) {
  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { passphrase } = parsed.data;

    const company = await prisma.company.findUnique({
      where: { id: authResult.companyId },
      select: { encryptionSetupAt: true },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    if (company.encryptionSetupAt) {
      return NextResponse.json(
        { success: false, error: "Encryption is already set up" },
        { status: 409 }
      );
    }

    const salt = generateSalt();
    const saltBuffer = Buffer.from(salt, "base64");
    const masterKey = deriveKey(passphrase, saltBuffer);
    const dataKey = generateDataKey();
    const encryptedDataKey = encryptDataKey(dataKey, masterKey);

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
      await tx.company.update({
        where: { id: authResult.companyId },
        data: {
          encryptionKeyEncrypted: encryptedDataKey,
          encryptionSalt: salt,
          encryptionSetupAt: new Date(),
          keyVersion: 1,
        },
      });

      await tx.recoveryCode.createMany({
        data: codeRecords.map((record) => ({
          companyId: authResult.companyId,
          codeHash: record.codeHash,
          encryptedDataKey: record.encryptedDataKey,
        })),
      });
    });

    return NextResponse.json({
      success: true,
      data: { recoveryCodes: codes },
    });
  } catch (error) {
    console.error("Encryption setup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set up encryption" },
      { status: 500 }
    );
  }
}
