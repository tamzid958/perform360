import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deriveKey,
  generateDataKey,
  decryptDataKey,
  encryptDataKey,
  encrypt,
  decrypt,
} from "@/lib/encryption";
import { applyRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const rotateSchema = z.object({
  passphrase: z.string().min(1, "Passphrase is required"),
});

const RE_ENCRYPT_BATCH_SIZE = 100;

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = rotateSchema.safeParse(body);

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
        keyVersion: true,
      },
    });

    if (!company || !company.encryptionSetupAt || !company.encryptionSalt) {
      return NextResponse.json(
        { success: false, error: "Encryption is not set up" },
        { status: 400 }
      );
    }

    // Verify passphrase by decrypting old data key
    const saltBuffer = Buffer.from(company.encryptionSalt, "base64");
    const masterKey = deriveKey(passphrase, saltBuffer);

    let oldDataKey: Buffer;
    try {
      oldDataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);
    } catch {
      return NextResponse.json(
        { success: false, error: "Incorrect passphrase" },
        { status: 400 }
      );
    }

    // Generate new data key and encrypt it with existing master key
    const newDataKey = generateDataKey();
    const newEncryptedDataKey = encryptDataKey(newDataKey, masterKey);
    const newKeyVersion = company.keyVersion + 1;

    // Re-encrypt recovery codes' data key copies with new data key info
    // Recovery codes store an independently encrypted copy of the data key.
    // We need to re-encrypt the NEW data key under each recovery code's derived key.
    const unusedCodes = await prisma.recoveryCode.findMany({
      where: { companyId: authResult.companyId, usedAt: null },
    });

    // For each recovery code, we can't re-derive the code's key (we only have hashes).
    // However, each recovery code's `encryptedDataKey` was encrypted with scrypt(code, salt).
    // Since we don't have the plain codes, we can't re-encrypt under the new data key.
    // We must delete recovery codes and require regeneration after key rotation.
    const recoveryCodesInvalidated = unusedCodes.length > 0;

    // Update company key + version, then re-encrypt all responses in batches
    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: authResult.companyId },
        data: {
          encryptionKeyEncrypted: newEncryptedDataKey,
          keyVersion: newKeyVersion,
        },
      });

      // Invalidate recovery codes — they encrypt the old data key
      if (recoveryCodesInvalidated) {
        await tx.recoveryCode.deleteMany({
          where: { companyId: authResult.companyId },
        });
      }
    });

    // Re-encrypt evaluation responses in batches outside the transaction
    // to avoid long-held locks on large datasets
    let reEncryptedCount = 0;
    let cursor: string | undefined;

    for (;;) {
      const responses = await prisma.evaluationResponse.findMany({
        where: {
          assignment: {
            cycle: { companyId: authResult.companyId },
          },
          keyVersion: { lt: newKeyVersion },
        },
        select: {
          id: true,
          answersEncrypted: true,
          answersIv: true,
          answersTag: true,
          keyVersion: true,
        },
        take: RE_ENCRYPT_BATCH_SIZE,
        ...(cursor
          ? { skip: 1, cursor: { id: cursor } }
          : {}),
        orderBy: { id: "asc" },
      });

      if (responses.length === 0) break;

      const updates = responses.map((response) => {
        // Decrypt with old data key
        const plaintext = decrypt(
          response.answersEncrypted,
          response.answersIv,
          response.answersTag,
          oldDataKey
        );

        // Re-encrypt with new data key
        const { encrypted, iv, tag } = encrypt(plaintext, newDataKey);

        return prisma.evaluationResponse.update({
          where: { id: response.id },
          data: {
            answersEncrypted: encrypted,
            answersIv: iv,
            answersTag: tag,
            keyVersion: newKeyVersion,
          },
        });
      });

      await prisma.$transaction(updates);
      reEncryptedCount += responses.length;
      cursor = responses[responses.length - 1].id;

      // If we got fewer than batch size, we're done
      if (responses.length < RE_ENCRYPT_BATCH_SIZE) break;
    }

    await writeAuditLog({
      companyId: authResult.companyId,
      userId: authResult.userId,
      action: "key_rotation",
      metadata: {
        oldKeyVersion: company.keyVersion,
        newKeyVersion,
        reEncryptedResponses: reEncryptedCount,
        recoveryCodesInvalidated,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        newKeyVersion,
        reEncryptedResponses: reEncryptedCount,
        recoveryCodesInvalidated,
      },
    });
  } catch (error) {
    console.error("Key rotation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to rotate encryption key" },
      { status: 500 }
    );
  }
}
