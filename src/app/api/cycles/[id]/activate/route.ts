import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
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

  // 2. Verify assignments already exist (created during DRAFT)
  const assignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId: cycle.id },
    select: {
      id: true,
      token: true,
      subjectId: true,
      reviewerId: true,
      relationship: true,
    },
  });

  if (assignments.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error:
          "No assignments found. Ensure teams have members with Manager and Direct Report roles.",
        code: "NO_ASSIGNMENTS",
      },
      { status: 400 }
    );
  }

  // 3. Update cycle status to ACTIVE and cache the data key for submissions
  const updatedCycle = await prisma.evaluationCycle.update({
    where: { id: cycle.id },
    data: { status: "ACTIVE", cachedDataKeyEncrypted },
  });

  // 4. Fetch reviewer and subject info for emails
  const userIds = new Set<string>();
  for (const a of assignments) {
    userIds.add(a.reviewerId);
    userIds.add(a.subjectId);
  }
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Group assignments by reviewer for batched emails
  const reviewerAssignments = new Map<
    string,
    { email: string; name: string; items: { token: string; subjectName: string }[] }
  >();

  for (const a of assignments) {
    const reviewer = userMap.get(a.reviewerId);
    if (!reviewer) continue;
    const subject = userMap.get(a.subjectId);

    if (!reviewerAssignments.has(reviewer.id)) {
      reviewerAssignments.set(reviewer.id, {
        email: reviewer.email,
        name: reviewer.name,
        items: [],
      });
    }
    reviewerAssignments.get(reviewer.id)!.items.push({
      token: a.token,
      subjectName: subject?.name ?? "Unknown",
    });
  }

  // 5. Send invitation emails in batches
  let emailsSent = 0;
  let emailsFailed = 0;

  const reviewerList = Array.from(reviewerAssignments.values());

  for (let i = 0; i < reviewerList.length; i += EMAIL_BATCH_SIZE) {
    const batch = reviewerList.slice(i, i + EMAIL_BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.flatMap((reviewer) =>
        reviewer.items.map((item) => {
          const evaluationUrl = `${APP_URL}/evaluate/${item.token}`;
          const { html, text } = getEvaluationInviteEmail(
            reviewer.name,
            item.subjectName,
            cycle.name,
            evaluationUrl
          );

          return sendEmail({
            to: reviewer.email,
            subject: `Evaluation Invitation: ${item.subjectName} — ${cycle.name}`,
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
    if (i + EMAIL_BATCH_SIZE < reviewerList.length) {
      await sleep(EMAIL_BATCH_DELAY_MS);
    }
  }

  await writeAuditLog({
    companyId: authResult.companyId,
    userId: authResult.userId,
    action: "cycle_activate",
    target: `cycle:${updatedCycle.id}`,
    metadata: { totalAssignments: assignments.length, emailsSent, emailsFailed },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedCycle.id,
      status: updatedCycle.status,
      totalAssignments: assignments.length,
      emailsSent,
      emailsFailed,
    },
  });
}
