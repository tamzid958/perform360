import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAssignmentsForCycle } from "@/lib/assignments";
import { sendEmail, getEvaluationInviteHtml } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Batch size for sending emails to avoid SMTP throttling */
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

  // 2. Verify template exists
  const template = await prisma.evaluationTemplate.findFirst({
    where: {
      id: cycle.templateId,
      OR: [
        { companyId: authResult.companyId },
        { isGlobal: true },
      ],
    },
  });

  if (!template) {
    return NextResponse.json(
      {
        success: false,
        error: "Cycle template not found or inaccessible",
        code: "NOT_FOUND",
      },
      { status: 400 }
    );
  }

  // 3. Generate assignments from team structure
  const { count, reviewerEmails } = await createAssignmentsForCycle(
    cycle.id,
    authResult.companyId
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

  // 4. Update cycle status to ACTIVE
  const updatedCycle = await prisma.evaluationCycle.update({
    where: { id: cycle.id },
    data: { status: "ACTIVE" },
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
          const html = getEvaluationInviteHtml(
            reviewer.name,
            assignment.subjectName,
            cycle.name,
            evaluationUrl
          );

          return sendEmail({
            to: reviewer.email,
            subject: `Evaluation Invitation: ${assignment.subjectName} — ${cycle.name}`,
            html,
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
