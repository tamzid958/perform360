import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail, getCompanyDestroyedEmail } from "@/lib/email";
import { getJobStatus } from "@/lib/queue";
import { cascadeDeleteCompany } from "@/lib/company-cascade-delete";
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
      companyId,
    }).catch((err) => {
      console.error(
        `[CompanyDestroy] Failed to email ${email}:`,
        err
      );
    })
  );
  await Promise.all(emailPromises);

  // ── Phase 5 & 6: Invalidate sessions + cascading delete ──

  await cascadeDeleteCompany(companyId);

  console.log(
    `[CompanyDestroy] Company ${companyId} (${companyName}) permanently destroyed`
  );
}
