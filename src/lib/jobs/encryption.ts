import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, decryptDataKey } from "@/lib/encryption";
import { writeAuditLog } from "@/lib/audit";
import { JOB_CONFIG } from "@/lib/constants";
import type { EncryptionRotateKeyPayload } from "@/types/job";

/**
 * Re-encrypts all evaluation responses from the old data key to the new one.
 * The key update + recovery code deletion already happened synchronously
 * in the API route. This handler only does the batch re-encryption.
 *
 * maxAttempts should be 1 — partial re-encryption uses keyVersion filter,
 * so a new job can resume where this one left off.
 */
export async function handleEncryptionRotateKey(
  payload: EncryptionRotateKeyPayload
): Promise<void> {
  const { companyId, userId, masterKeyHex, oldDataKeyHex, newKeyVersion } = payload;

  const oldDataKey = Buffer.from(oldDataKeyHex, "hex");

  // Fetch the company's NEW encrypted data key (set by API route before enqueuing)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { encryptionKeyEncrypted: true },
  });

  if (!company) throw new Error(`Company not found: ${companyId}`);

  const masterKey = Buffer.from(masterKeyHex, "hex");
  const newPlainDataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);

  let reEncryptedCount = 0;
  let cursor: string | undefined;

  for (;;) {
    const responses = await prisma.evaluationResponse.findMany({
      where: {
        assignment: {
          cycle: { companyId },
        },
        keyVersion: { lt: newKeyVersion },
      },
      select: {
        id: true,
        answersEncrypted: true,
        answersIv: true,
        answersTag: true,
      },
      take: JOB_CONFIG.reEncryptBatchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (responses.length === 0) break;

    const updates = responses.map((response) => {
      const plaintext = decrypt(
        response.answersEncrypted,
        response.answersIv,
        response.answersTag,
        oldDataKey
      );

      const { encrypted, iv, tag } = encrypt(plaintext, newPlainDataKey);

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

    if (responses.length < JOB_CONFIG.reEncryptBatchSize) break;
  }

  await writeAuditLog({
    companyId,
    userId,
    action: "key_rotation",
    metadata: {
      newKeyVersion,
      reEncryptedResponses: reEncryptedCount,
      source: "background_job",
    },
  });

  console.log(`[Jobs] Key rotation complete for company ${companyId}: ${reEncryptedCount} responses re-encrypted`);
}
