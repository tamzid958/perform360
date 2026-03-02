import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { decryptDataKeyFromCookie } from "@/lib/encryption-session";
import { validateEvaluationSession } from "@/lib/session-validation";
import { enqueueBatch } from "@/lib/queue";
import { JOB_TYPES } from "@/types/job";
import { getCycleCompletionEmail } from "@/lib/email";
import type { EmailSendPayload } from "@/types/job";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// ─── GET: Token Validation ───
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate OTP session from cookie (supports both direct and summary sessions)
    const sessionToken = request.cookies.get("evaluation_session")?.value;
    if (!sessionToken) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Authentication required", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    const result = await validateEvaluationSession(sessionToken, token);
    if (!result.ok) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: result.error, code: result.code },
        { status: result.status }
      );
    }

    const { assignment } = result.session;

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

    // Validate required questions are answered (using assignment's per-team template)
    const template = await prisma.evaluationTemplate.findFirst({
      where: { id: assignment.templateId },
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

    // Read the cached data key that was stored on the cycle when admin activated it
    const cycle = await prisma.evaluationCycle.findUnique({
      where: { id: assignment.cycleId },
      select: { cachedDataKeyEncrypted: true, name: true },
    });

    if (!cycle?.cachedDataKeyEncrypted) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Encryption not available for this cycle. Admin must re-activate." },
        { status: 500 }
      );
    }

    const dataKey = decryptDataKeyFromCookie(cycle.cachedDataKeyEncrypted);
    if (!dataKey) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Failed to decrypt cycle encryption key" },
        { status: 500 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: assignment.cycle.companyId },
      select: { keyVersion: true, settings: true },
    });

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
          keyVersion: company?.keyVersion ?? 1,
          submittedAt: new Date(),
        },
      }),
      prisma.evaluationAssignment.update({
        where: { id: assignment.id },
        data: { status: "SUBMITTED" },
      }),
    ]);

    // Post-submission: notify admins if cycle just reached 100% completion
    try {
      const notifications = (company?.settings as Record<string, unknown> | null)
        ?.notifications as Record<string, unknown> | undefined;
      if (notifications?.cycleCompletion !== false) {
        const remaining = await prisma.evaluationAssignment.count({
          where: { cycleId: assignment.cycleId, status: { not: "SUBMITTED" } },
        });
        if (remaining === 0) {
          const [totalAssignments, admins] = await Promise.all([
            prisma.evaluationAssignment.count({ where: { cycleId: assignment.cycleId } }),
            prisma.user.findMany({
              where: { companyId: assignment.cycle.companyId, role: { in: ["ADMIN", "HR"] } },
              select: { email: true },
            }),
          ]);
          if (admins.length > 0 && cycle) {
            const { html, text } = getCycleCompletionEmail(cycle.name, totalAssignments);
            const emailJobs: Array<{ type: typeof JOB_TYPES.EMAIL_SEND; payload: EmailSendPayload }> =
              admins.map((admin) => ({
                type: JOB_TYPES.EMAIL_SEND,
                payload: {
                  to: admin.email,
                  subject: `Cycle complete — ${cycle.name}`,
                  html,
                  text,
                },
              }));
            await enqueueBatch(emailJobs);
          }
        }
      }
    } catch (err) {
      console.error("Failed to queue cycle completion email:", err);
    }

    // Fetch remaining pending evaluations for this reviewer
    const pendingAssignments = await prisma.evaluationAssignment.findMany({
      where: {
        reviewerId: assignment.reviewerId,
        status: { not: "SUBMITTED" },
        id: { not: assignment.id },
        cycle: { status: "ACTIVE" },
      },
      select: {
        token: true,
        relationship: true,
        subjectId: true,
        cycle: { select: { name: true } },
      },
    });

    const subjectIds = [...new Set(pendingAssignments.map((a) => a.subjectId))];
    const subjects = subjectIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true },
        })
      : [];
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

    const remaining = pendingAssignments.map((a) => ({
      token: a.token,
      subjectName: subjectMap.get(a.subjectId) ?? "Unknown",
      cycleName: a.cycle.name,
      relationship: a.relationship,
    }));

    return NextResponse.json<ApiResponse<{
      submitted: true;
      remaining: typeof remaining;
    }>>({
      success: true,
      data: { submitted: true, remaining },
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to submit evaluation" },
      { status: 500 }
    );
  }
}
