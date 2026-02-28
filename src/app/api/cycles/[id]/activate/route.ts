import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAssignmentsForCycle } from "@/lib/assignments";
import { sendEmail, getEvaluationInviteEmail } from "@/lib/email";
import { getDataKeyFromRequest, encryptDataKeyForCookie } from "@/lib/encryption-session";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Batch size for sending emails to avoid SMTP throttling */
const EMAIL_BATCH_SIZE = 10;
const EMAIL_BATCH_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  // 1. Fetch cycle and validate
  const cycle = await prisma.evaluationCycle.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!cycle) {
    return NextResponse.json(
      { success: false, error: "Cycle not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (cycle.status !== "DRAFT") {
    return NextResponse.json(
      {
        success: false,
        error: "Only DRAFT cycles can be activated",
        code: "INVALID_STATUS",
      },
      { status: 400 }
    );
  }

  // Require the admin's decrypted data key (from encryption unlock session).
  // This is cached on the cycle so the submission route can encrypt reviewer answers.
  const dataKey = getDataKeyFromRequest(request);
  if (!dataKey) {
    return NextResponse.json(
      {
        success: false,
        error: "Encryption locked. Enter your passphrase before activating a cycle.",
        code: "ENCRYPTION_LOCKED",
      },
      { status: 403 }
    );
  }
  const cachedDataKeyEncrypted = encryptDataKeyForCookie(dataKey);

  // 2. Fetch CycleTeam entries and verify templates
  const cycleTeams = await prisma.cycleTeam.findMany({
    where: { cycleId: cycle.id },
    include: {
      template: { select: { id: true } },
    },
  });

  if (cycleTeams.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "No teams assigned to this cycle. Add team-template pairs before activating.",
        code: "NO_TEAMS",
      },
      { status: 400 }
    );
  }

  // Verify all templates still exist and are accessible
  const templateIds = Array.from(new Set(cycleTeams.map((ct) => ct.templateId)));
  const templates = await prisma.evaluationTemplate.findMany({
    where: {
      id: { in: templateIds },
      OR: [
        { companyId: authResult.companyId },
        { isGlobal: true },
      ],
    },
    select: { id: true },
  });

  if (templates.length !== templateIds.length) {
    return NextResponse.json(
      {
        success: false,
        error: "One or more cycle templates not found or inaccessible",
        code: "NOT_FOUND",
      },
      { status: 400 }
    );
  }

  // 3. Generate assignments from team structure (only selected teams)
  const teamTemplatePairs = cycleTeams.map((ct) => ({
    teamId: ct.teamId,
    templateId: ct.templateId,
  }));

  const { count, reviewerEmails } = await createAssignmentsForCycle(
    cycle.id,
    authResult.companyId,
    teamTemplatePairs
  );

  if (count === 0) {
    return NextResponse.json(
      {
        success: false,
        error:
          "No assignments could be generated. Ensure teams have members with Manager and Direct Report roles.",
        code: "NO_ASSIGNMENTS",
      },
      { status: 400 }
    );
  }

  // 4. Update cycle status to ACTIVE and cache the data key for submissions
  const updatedCycle = await prisma.evaluationCycle.update({
    where: { id: cycle.id },
    data: { status: "ACTIVE", cachedDataKeyEncrypted },
  });

  // 5. Send invitation emails in batches
  let emailsSent = 0;
  let emailsFailed = 0;

  for (let i = 0; i < reviewerEmails.length; i += EMAIL_BATCH_SIZE) {
    const batch = reviewerEmails.slice(i, i + EMAIL_BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.flatMap((reviewer) =>
        reviewer.assignments.map((assignment) => {
          const evaluationUrl = `${APP_URL}/evaluate/${assignment.token}`;
          const { html, text } = getEvaluationInviteEmail(
            reviewer.name,
            assignment.subjectName,
            cycle.name,
            evaluationUrl
          );

          return sendEmail({
            to: reviewer.email,
            subject: `Evaluation Invitation: ${assignment.subjectName} — ${cycle.name}`,
            html,
            text,
          });
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    // Rate limit between batches
    if (i + EMAIL_BATCH_SIZE < reviewerEmails.length) {
      await sleep(EMAIL_BATCH_DELAY_MS);
    }
  }

  await writeAuditLog({
    companyId: authResult.companyId,
    userId: authResult.userId,
    action: "cycle_activate",
    target: `cycle:${updatedCycle.id}`,
    metadata: { assignmentsCreated: count, emailsSent, emailsFailed },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedCycle.id,
      status: updatedCycle.status,
      assignmentsCreated: count,
      emailsSent,
      emailsFailed,
    },
  });
}
