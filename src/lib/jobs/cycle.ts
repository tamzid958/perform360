import { prisma } from "@/lib/prisma";
import { enqueueBatch } from "@/lib/queue";
import { getEvaluationInviteEmail, getEvaluationReminderEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { JOB_TYPES } from "@/types/job";
import type {
  CycleActivatePayload,
  CycleRemindPayload,
  CycleAutoClosePayload,
  EmailSendPayload,
} from "@/types/job";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Fetches assignments + users for a cycle and enqueues individual email.send jobs.
 */
export async function handleCycleActivate(
  payload: CycleActivatePayload
): Promise<void> {
  const { cycleId, companyId, userId } = payload;

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: { name: true },
  });

  if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);

  const assignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: {
      id: true,
      token: true,
      subjectId: true,
      reviewerId: true,
    },
  });

  if (assignments.length === 0) return;

  // Fetch user info
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

  // Build email jobs
  const emailJobs: Array<{
    type: typeof JOB_TYPES.EMAIL_SEND;
    payload: EmailSendPayload;
  }> = [];

  for (const a of assignments) {
    const reviewer = userMap.get(a.reviewerId);
    const subject = userMap.get(a.subjectId);
    if (!reviewer || !subject) continue;

    const evaluationUrl = `${APP_URL}/evaluate/${a.token}`;
    const { html, text } = getEvaluationInviteEmail(
      reviewer.name,
      subject.name,
      cycle.name,
      evaluationUrl
    );

    emailJobs.push({
      type: JOB_TYPES.EMAIL_SEND,
      payload: {
        to: reviewer.email,
        subject: `Evaluation Invitation: ${subject.name} — ${cycle.name}`,
        html,
        text,
        companyId,
      },
    });
  }

  if (emailJobs.length > 0) {
    await enqueueBatch(emailJobs);
  }

  await writeAuditLog({
    companyId,
    userId,
    action: "cycle_activate",
    target: `cycle:${cycleId}`,
    metadata: { totalAssignments: assignments.length, emailsQueued: emailJobs.length },
  });
}

/**
 * Sends reminder emails for pending/in-progress assignments.
 */
export async function handleCycleRemind(
  payload: CycleRemindPayload
): Promise<void> {
  const { cycleId, companyId, assignmentId } = payload;

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: { name: true, endDate: true, status: true },
  });

  if (!cycle || cycle.status !== "ACTIVE") return;

  const pendingAssignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      ...(assignmentId ? { id: assignmentId } : {}),
    },
    select: {
      token: true,
      reviewerId: true,
      subjectId: true,
    },
  });

  if (pendingAssignments.length === 0) return;

  const userIds = Array.from(
    new Set(pendingAssignments.flatMap((a) => [a.reviewerId, a.subjectId]))
  );

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const deadline = cycle.endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const emailJobs: Array<{
    type: typeof JOB_TYPES.EMAIL_SEND;
    payload: EmailSendPayload;
  }> = [];

  for (const a of pendingAssignments) {
    const reviewer = userMap.get(a.reviewerId);
    const subject = userMap.get(a.subjectId);
    if (!reviewer || !subject) continue;

    const evaluationUrl = `${APP_URL}/evaluate/${a.token}`;
    const { html, text } = getEvaluationReminderEmail(
      reviewer.name,
      subject.name,
      cycle.name,
      deadline,
      evaluationUrl
    );

    emailJobs.push({
      type: JOB_TYPES.EMAIL_SEND,
      payload: {
        to: reviewer.email,
        subject: `Reminder: Evaluation for ${subject.name} — ${cycle.name}`,
        html,
        text,
        companyId,
      },
    });
  }

  if (emailJobs.length > 0) {
    await enqueueBatch(emailJobs);
  }

  await writeAuditLog({
    companyId,
    action: "cycle_remind",
    target: `cycle:${cycleId}`,
    metadata: { remindersQueued: emailJobs.length },
  });
}

/**
 * Closes all ACTIVE cycles past their endDate.
 */
export async function handleCycleAutoClose(
  _payload: CycleAutoClosePayload
): Promise<void> {
  const overdueCycles = await prisma.evaluationCycle.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: new Date() },
    },
    select: { id: true, companyId: true, name: true },
  });

  for (const cycle of overdueCycles) {
    await prisma.evaluationCycle.update({
      where: { id: cycle.id },
      data: { status: "CLOSED" },
    });

    await writeAuditLog({
      companyId: cycle.companyId,
      action: "cycle_close",
      target: `cycle:${cycle.id}`,
      metadata: { reason: "auto-close (past deadline)" },
    });

    console.log(`[Jobs] Auto-closed cycle "${cycle.name}" (${cycle.id})`);
  }
}
