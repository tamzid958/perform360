import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { decrypt, decryptDataKey, deriveKey } from "@/lib/encryption";

type ExportResponse =
  | { success: false; error: string; code?: string }
  | { success: true; data: { exportedAt: string; companyId: string } };

const exportSchema = z.object({
  passphrase: z.string().min(1, "Passphrase is required"),
});

function safeParseAnswers(
  answersEncrypted: string,
  answersIv: string,
  answersTag: string,
  dataKey: Buffer
): unknown {
  const plaintext = decrypt(answersEncrypted, answersIv, answersTag, dataKey);
  try {
    return JSON.parse(plaintext);
  } catch {
    return plaintext;
  }
}

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
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
        encryptionKeyEncrypted: true,
        encryptionSalt: true,
        encryptionSetupAt: true,
        keyVersion: true,
        createdAt: true,
        updatedAt: true,
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

    const [
      users,
      teams,
      templates,
      cycles,
      assignments,
      auditLogs,
      recoveryCodes,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { companyId: company.id },
        include: {
          teamMemberships: {
            select: { id: true, teamId: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.team.findMany({
        where: { companyId: company.id },
        include: {
          members: {
            select: { id: true, userId: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.evaluationTemplate.findMany({
        where: {
          OR: [
            { companyId: company.id },
            {
              cycleTeams: {
                some: {
                  cycle: {
                    companyId: company.id,
                  },
                },
              },
            },
          ],
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.evaluationCycle.findMany({
        where: { companyId: company.id },
        include: {
          cycleTeams: {
            select: {
              id: true,
              teamId: true,
              templateId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.evaluationAssignment.findMany({
        where: {
          cycle: { companyId: company.id },
        },
        include: {
          otpSessions: true,
          responses: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.auditLog.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.recoveryCode.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const assignmentsDecrypted = assignments.map((assignment) => ({
      id: assignment.id,
      cycleId: assignment.cycleId,
      templateId: assignment.templateId,
      subjectId: assignment.subjectId,
      reviewerId: assignment.reviewerId,
      relationship: assignment.relationship,
      status: assignment.status,
      token: assignment.token,
      createdAt: assignment.createdAt,
      otpSessions: assignment.otpSessions,
      responses: assignment.responses.map((response) => ({
        id: response.id,
        assignmentId: response.assignmentId,
        reviewerId: response.reviewerId,
        subjectId: response.subjectId,
        keyVersion: response.keyVersion,
        submittedAt: response.submittedAt,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        answers: safeParseAnswers(
          response.answersEncrypted,
          response.answersIv,
          response.answersTag,
          dataKey
        ),
      })),
    }));

    const exportedAt = new Date().toISOString();
    const payload = {
      metadata: {
        schemaVersion: 1,
        exportedAt,
        exportedBy: {
          userId: authResult.userId,
          email: authResult.email,
        },
      },
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo,
        settings: company.settings,
        keyVersion: company.keyVersion,
        encryptionSetupAt: company.encryptionSetupAt,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
      users,
      teams,
      templates,
      cycles,
      assignments: assignmentsDecrypted,
      auditLogs,
      recoveryCodes,
    };

    const fileName = `perform360-${company.slug}-data-dump-${exportedAt.slice(0, 10)}.json`;
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Company data export error:", error);
    return NextResponse.json<ExportResponse>(
      { success: false, error: "Failed to export company data", code: "EXPORT_FAILED" },
      { status: 500 }
    );
  }
}
