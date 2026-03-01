import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { decryptDataKey, deriveKey } from "@/lib/encryption";
import { enqueue } from "@/lib/queue";
import { JOB_TYPES } from "@/types/job";

type ExportResponse =
  | { success: false; error: string; code?: string }
  | { success: true; data: { jobId: string } };

const exportSchema = z.object({
  passphrase: z.string().min(1, "Passphrase is required"),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = exportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ExportResponse>(
        { success: false, error: parsed.error.issues[0].message, code: "VALIDATION_ERROR" },
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

    if (!company) {
      return NextResponse.json<ExportResponse>(
        { success: false, error: "Company not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!company.encryptionSetupAt || !company.encryptionSalt) {
      return NextResponse.json<ExportResponse>(
        { success: false, error: "Encryption is not set up", code: "ENCRYPTION_NOT_SETUP" },
        { status: 400 }
      );
    }

    const masterKey = deriveKey(passphrase, Buffer.from(company.encryptionSalt, "base64"));
    let dataKey: Buffer;
    try {
      dataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);
    } catch {
      return NextResponse.json<ExportResponse>(
        { success: false, error: "Incorrect passphrase", code: "INVALID_PASSPHRASE" },
        { status: 400 }
      );
    }

    const jobId = await enqueue(
      JOB_TYPES.DATA_EXPORT,
      {
        companyId: authResult.companyId,
        userId: authResult.userId,
        userEmail: authResult.email,
        dataKeyHex: dataKey.toString("hex"),
      },
      { maxAttempts: 1 }
    );

    return NextResponse.json<ExportResponse>(
      { success: true, data: { jobId } },
      { status: 202 }
    );
  } catch (error) {
    console.error("Company data export error:", error);
    return NextResponse.json<ExportResponse>(
      { success: false, error: "Failed to start data export", code: "EXPORT_FAILED" },
      { status: 500 }
    );
  }
}
