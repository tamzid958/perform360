import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, deriveKey, decryptDataKey } from "@/lib/encryption";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// ─── GET: Token Validation ───
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const assignment = await prisma.evaluationAssignment.findUnique({
      where: { token },
      include: {
        cycle: { select: { name: true, status: true, endDate: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Invalid evaluation link", code: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    if (assignment.cycle.status !== "ACTIVE") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation cycle is no longer active", code: "CYCLE_INACTIVE" },
        { status: 410 }
      );
    }

    if (assignment.status === "SUBMITTED") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation has already been submitted", code: "ALREADY_SUBMITTED" },
        { status: 410 }
      );
    }

    if (new Date() > assignment.cycle.endDate) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation cycle has ended", code: "CYCLE_EXPIRED" },
        { status: 410 }
      );
    }

    const [subject, reviewer] = await Promise.all([
      prisma.user.findFirst({ where: { id: assignment.subjectId }, select: { name: true } }),
      prisma.user.findFirst({ where: { id: assignment.reviewerId }, select: { name: true, email: true } }),
    ]);

    // Mask reviewer email for display (show first 2 chars + domain)
    const email = reviewer?.email ?? "";
    const [localPart, domain] = email.split("@");
    const maskedEmail = localPart && domain
      ? `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 0))}@${domain}`
      : "";

    return NextResponse.json<ApiResponse<{
      token: string;
      subjectName: string;
      reviewerEmailMasked: string;
      cycleName: string;
      relationship: string;
    }>>({
      success: true,
      data: {
        token,
        subjectName: subject?.name ?? "Unknown",
        reviewerEmailMasked: maskedEmail,
        cycleName: assignment.cycle.name,
        relationship: assignment.relationship,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to validate evaluation link" },
      { status: 500 }
    );
  }
}

// ─── POST: Submit Evaluation ───
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Validate OTP session from cookie
    const sessionToken = request.cookies.get("evaluation_session")?.value;
    if (!sessionToken) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Authentication required", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    const otpSession = await prisma.otpSession.findUnique({
      where: { sessionToken },
      include: {
        assignment: {
          include: {
            cycle: {
              select: {
                templateId: true,
                status: true,
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!otpSession || !otpSession.sessionExpiry || otpSession.sessionExpiry < new Date()) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Session expired. Please verify again.", code: "SESSION_EXPIRED" },
        { status: 401 }
      );
    }

    if (otpSession.assignment.token !== token) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Session does not match this evaluation", code: "SESSION_MISMATCH" },
        { status: 403 }
      );
    }

    const { assignment } = otpSession;

    if (assignment.status === "SUBMITTED") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation has already been submitted", code: "ALREADY_SUBMITTED" },
        { status: 410 }
      );
    }

    if (assignment.cycle.status !== "ACTIVE") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation cycle is no longer active", code: "CYCLE_INACTIVE" },
        { status: 410 }
      );
    }

    // Parse and validate answers
    const body = await request.json();
    const { answers } = body as { answers: Record<string, string | number | boolean> };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Invalid submission data" },
        { status: 400 }
      );
    }

    // Validate required questions are answered
    const template = await prisma.evaluationTemplate.findFirst({
      where: { id: assignment.cycle.templateId },
      select: { sections: true },
    });

    if (!template) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Evaluation template not found" },
        { status: 500 }
      );
    }

    const sections = template.sections as Array<{
      questions: Array<{ id: string; required: boolean }>;
    }>;
    const requiredIds = sections
      .flatMap((s) => s.questions)
      .filter((q) => q.required)
      .map((q) => q.id);

    const missing = requiredIds.filter(
      (id) => answers[id] === undefined || answers[id] === ""
    );
    if (missing.length > 0) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: `Missing required answers: ${missing.join(", ")}`,
          code: "MISSING_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Encrypt answers with company's data key
    const company = await prisma.company.findUnique({
      where: { id: assignment.cycle.companyId },
      select: {
        encryptionKeyEncrypted: true,
        encryptionSalt: true,
        keyVersion: true,
      },
    });

    if (!company || !company.encryptionSalt) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Company encryption not configured" },
        { status: 500 }
      );
    }

    // Derive master key from server-side passphrase to decrypt the data key.
    // In the full E2EE flow, the admin session caches the decrypted data key.
    const passphrase = process.env.ENCRYPTION_PASSPHRASE;
    if (!passphrase) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Server encryption configuration error" },
        { status: 500 }
      );
    }

    const salt = Buffer.from(company.encryptionSalt, "base64");
    const masterKey = deriveKey(passphrase, salt);
    const dataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);

    const answersJson = JSON.stringify(answers);
    const { encrypted, iv, tag } = encrypt(answersJson, dataKey);

    // Create response and update assignment in a transaction
    await prisma.$transaction([
      prisma.evaluationResponse.create({
        data: {
          assignmentId: assignment.id,
          reviewerId: assignment.reviewerId,
          subjectId: assignment.subjectId,
          answersEncrypted: encrypted,
          answersIv: iv,
          answersTag: tag,
          keyVersion: company.keyVersion,
          submittedAt: new Date(),
        },
      }),
      prisma.evaluationAssignment.update({
        where: { id: assignment.id },
        data: { status: "SUBMITTED" },
      }),
    ]);

    return NextResponse.json<ApiResponse<{ submitted: true }>>({
      success: true,
      data: { submitted: true },
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to submit evaluation" },
      { status: 500 }
    );
  }
}
