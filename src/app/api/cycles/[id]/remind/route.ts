import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getEvaluationReminderHtml } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const EMAIL_BATCH_SIZE = 10;
const EMAIL_BATCH_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  // 1. Fetch cycle and validate status
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

  if (cycle.status !== "ACTIVE") {
    return NextResponse.json(
      {
        success: false,
        error: "Reminders can only be sent for ACTIVE cycles",
        code: "INVALID_STATUS",
      },
      { status: 400 }
    );
  }

  // 2. Query pending/in-progress assignments with reviewer info
  const pendingAssignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId: params.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      cycle: { select: { name: true, endDate: true } },
    },
  });

  if (pendingAssignments.length === 0) {
    return NextResponse.json({
      success: true,
      data: { sent: 0, message: "All evaluations have been submitted" },
    });
  }

  // 3. Fetch reviewer and subject user info
  const userIds = Array.from(
    new Set(
      pendingAssignments.flatMap((a) => [a.reviewerId, a.subjectId])
    )
  );

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // 4. Send reminder emails in batches
  const deadline = cycle.endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let emailsSent = 0;
  let emailsFailed = 0;

  for (let i = 0; i < pendingAssignments.length; i += EMAIL_BATCH_SIZE) {
    const batch = pendingAssignments.slice(i, i + EMAIL_BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((assignment) => {
        const reviewer = userMap.get(assignment.reviewerId);
        const subject = userMap.get(assignment.subjectId);

        if (!reviewer || !subject) {
          return Promise.reject(new Error("User not found"));
        }

        const evaluationUrl = `${APP_URL}/evaluate/${assignment.token}`;
        const html = getEvaluationReminderHtml(
          reviewer.name,
          subject.name,
          cycle.name,
          deadline,
          evaluationUrl
        );

        return sendEmail({
          to: reviewer.email,
          subject: `Reminder: Evaluation for ${subject.name} — ${cycle.name}`,
          html,
        });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    if (i + EMAIL_BATCH_SIZE < pendingAssignments.length) {
      await sleep(EMAIL_BATCH_DELAY_MS);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      sent: emailsSent,
      failed: emailsFailed,
      totalPending: pendingAssignments.length,
    },
  });
}
