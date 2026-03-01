import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { deriveKey, decryptDataKey } from "@/lib/encryption";
import { enqueue } from "@/lib/queue";
import { JOB_TYPES } from "@/types/job";
import { writeAuditLog } from "@/lib/audit";

type DestroyResponse =
  | { success: false; error: string; code?: string }
  | { success: true; data: { jobId: string } };

const destroySchema = z.object({
  passphrase: z.string().min(1, "Passphrase is required"),
  confirmName: z.string().min(1, "Company name confirmation is required"),
  exportBeforeDestroy: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = destroySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<DestroyResponse>(
        {
          success: false,
          error: parsed.error.issues[0].message,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { passphrase, confirmName, exportBeforeDestroy } = parsed.data;

    const company = await prisma.company.findUnique({
      where: { id: authResult.companyId },
      select: {
        id: true,
        name: true,
        encryptionKeyEncrypted: true,
        encryptionSalt: true,
        encryptionSetupAt: true,
      },
    });

    if (!company) {
      return NextResponse.json<DestroyResponse>(
        { success: false, error: "Company not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify company name matches
    if (
      confirmName.trim().toLowerCase() !== company.name.trim().toLowerCase()
    ) {
      return NextResponse.json<DestroyResponse>(
        {
          success: false,
          error: "Company name does not match",
          code: "NAME_MISMATCH",
        },
        { status: 400 }
      );
    }

    // Verify encryption is set up
    if (!company.encryptionSetupAt || !company.encryptionSalt) {
      return NextResponse.json<DestroyResponse>(
        {
          success: false,
          error: "Encryption is not set up",
          code: "ENCRYPTION_NOT_SETUP",
        },
        { status: 400 }
      );
    }

    // Verify passphrase by attempting to decrypt the data key
    const masterKey = deriveKey(
      passphrase,
      Buffer.from(company.encryptionSalt, "base64")
    );
    let dataKey: Buffer;
    try {
      dataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);
    } catch {
      return NextResponse.json<DestroyResponse>(
        {
          success: false,
          error: "Incorrect passphrase",
          code: "INVALID_PASSPHRASE",
        },
        { status: 400 }
      );
    }

    // Snapshot admin emails for the confirmation email
    const adminUsers = await prisma.user.findMany({
      where: { companyId: company.id, role: "ADMIN" },
      select: { email: true },
    });
    const adminEmails = adminUsers.map((u) => u.email);

    // Optionally enqueue data export first
    let exportJobId: string | undefined;
    if (exportBeforeDestroy) {
      exportJobId = await enqueue(
        JOB_TYPES.DATA_EXPORT,
        {
          companyId: authResult.companyId,
          userId: authResult.userId,
          userEmail: authResult.email,
          dataKeyHex: dataKey.toString("hex"),
        },
        { maxAttempts: 1 }
      );
    }

    // Enqueue the destroy job
    const destroyJobId = await enqueue(
      JOB_TYPES.COMPANY_DESTROY,
      {
        companyId: company.id,
        userId: authResult.userId,
        userEmail: authResult.email,
        companyName: company.name,
        adminEmails,
        exportJobId,
      },
      {
        maxAttempts: 1,
        ...(exportJobId ? { runAt: new Date(Date.now() + 5000) } : {}),
      }
    );

    await writeAuditLog({
      companyId: company.id,
      userId: authResult.userId,
      action: "company_destroy",
      target: `company:${company.id}`,
      metadata: {
        companyName: company.name,
        exportRequested: exportBeforeDestroy,
        destroyJobId,
        exportJobId: exportJobId ?? null,
      },
    });

    return NextResponse.json<DestroyResponse>(
      { success: true, data: { jobId: destroyJobId } },
      { status: 202 }
    );
  } catch (error) {
    console.error("Company destroy error:", error);
    return NextResponse.json<DestroyResponse>(
      {
        success: false,
        error: "Failed to initiate company destruction",
        code: "DESTROY_FAILED",
      },
      { status: 500 }
    );
  }
}
