import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail, getCompanyDestroyedEmail } from "@/lib/email";
import { getJobStatus } from "@/lib/queue";
import type { CompanyDestroyPayload } from "@/types/job";

export async function handleCompanyDestroy(
  payload: CompanyDestroyPayload
): Promise<void> {
  const { companyId, userId, userEmail, companyName, adminEmails, exportJobId } =
    payload;

  // ── Phase 1: Wait for optional data export to complete ──

  if (exportJobId) {
    const maxWaitMs = 10 * 60 * 1000;
    const pollIntervalMs = 5000;
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const exportJob = await getJobStatus(exportJobId);
      if (!exportJob) {
        console.warn(
          `[CompanyDestroy] Export job ${exportJobId} not found, proceeding`
        );
        break;
      }
      if (exportJob.status === "COMPLETED") {
        console.log(
          `[CompanyDestroy] Export job ${exportJobId} completed, proceeding`
        );
        break;
      }
      if (exportJob.status === "DEAD" || exportJob.status === "FAILED") {
        console.warn(
          `[CompanyDestroy] Export job ${exportJobId} ${exportJob.status}, proceeding anyway`
        );
        break;
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  // ── Phase 2: Verify company still exists ──

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });

  if (!company) {
    console.log(
      `[CompanyDestroy] Company ${companyId} already deleted, skipping`
    );
    return;
  }

  // ── Phase 3: Write final audit log (will be deleted with company) ──

  await writeAuditLog({
    companyId,
    userId,
    action: "company_destroy",
    metadata: {
      companyName,
      initiatedBy: userEmail,
      destroyedAt: new Date().toISOString(),
    },
  });

  // ── Phase 4: Send confirmation emails BEFORE deletion ──

  const destroyedAt = new Date().toISOString().slice(0, 10);
  const { html, text } = getCompanyDestroyedEmail(
    companyName,
    destroyedAt,
    userEmail
  );

  const emailPromises = adminEmails.map((email) =>
    sendEmail({
      to: email,
      subject: `${companyName} has been permanently deleted from Perform360`,
      html,
      text,
    }).catch((err) => {
      console.error(
        `[CompanyDestroy] Failed to email ${email}:`,
        err
      );
    })
  );
  await Promise.all(emailPromises);

  // ── Phase 5: Invalidate all sessions for company users ──

  const companyUsers = await prisma.user.findMany({
    where: { companyId },
    select: { authUserId: true },
  });

  const authUserIds = companyUsers
    .map((u) => u.authUserId)
    .filter((id): id is string => id !== null);

  if (authUserIds.length > 0) {
    await prisma.session.deleteMany({
      where: { userId: { in: authUserIds } },
    });
    console.log(
      `[CompanyDestroy] Invalidated sessions for ${authUserIds.length} auth users`
    );
  }

  // ── Phase 6: Cascading delete (leaf-to-root) ──

  // OTP sessions (via assignment → cycle)
  await prisma.otpSession.deleteMany({
    where: { assignment: { cycle: { companyId } } },
  });

  // Evaluation responses (via assignment → cycle)
  await prisma.evaluationResponse.deleteMany({
    where: { assignment: { cycle: { companyId } } },
  });

  // Evaluation assignments (via cycle)
  await prisma.evaluationAssignment.deleteMany({
    where: { cycle: { companyId } },
  });

  // Cycle-team links (via cycle)
  await prisma.cycleTeam.deleteMany({
    where: { cycle: { companyId } },
  });

  // Evaluation cycles
  await prisma.evaluationCycle.deleteMany({
    where: { companyId },
  });

  // Team members (via team)
  await prisma.teamMember.deleteMany({
    where: { team: { companyId } },
  });

  // Teams
  await prisma.team.deleteMany({
    where: { companyId },
  });

  // Company-scoped templates
  await prisma.evaluationTemplate.deleteMany({
    where: { companyId },
  });

  // Recovery codes
  await prisma.recoveryCode.deleteMany({
    where: { companyId },
  });

  // Audit logs
  await prisma.auditLog.deleteMany({
    where: { companyId },
  });

  // Company-scoped users (NOT AuthUser)
  await prisma.user.deleteMany({
    where: { companyId },
  });

  // Company itself
  await prisma.company.delete({
    where: { id: companyId },
  });

  console.log(
    `[CompanyDestroy] Company ${companyId} (${companyName}) permanently destroyed`
  );
}
