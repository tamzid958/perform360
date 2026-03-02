import { prisma } from "@/lib/prisma";
import { buildIndividualReport } from "@/lib/reports";
import { renderReportToPdf } from "@/lib/pdf/render-report";
import { getReportsExportEmail, sendEmailWithAttachments } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import type { ReportsExportCyclePayload } from "@/types/job";
import JSZip from "jszip";

const MAX_ATTACHMENT_BYTES = 38 * 1024 * 1024; // 38 MB (Resend limit is 40 MB)

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
}

export async function handleReportsExportCycle(
  payload: ReportsExportCyclePayload
): Promise<void> {
  const { cycleId, companyId, userId, userEmail, dataKeyHex } = payload;
  const dataKey = Buffer.from(dataKeyHex, "hex");

  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, companyId },
    select: { id: true, name: true },
  });

  if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);

  const subjects = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: { subjectId: true },
    distinct: ["subjectId"],
  });

  if (subjects.length === 0) {
    throw new Error("No subjects found in cycle");
  }

  const zip = new JSZip();

  // Build reports sequentially to limit peak memory
  for (const { subjectId } of subjects) {
    const report = await buildIndividualReport(cycleId, subjectId, companyId, dataKey);
    const pdfBuffer = await renderReportToPdf(report, cycle.name);
    const filename = `${sanitizeFilename(report.subjectName)}-${sanitizeFilename(cycle.name)}.pdf`;
    zip.file(filename, pdfBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  if (zipBuffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `ZIP file is ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB, ` +
      `exceeding the 40 MB email attachment limit. Export individual reports instead.`
    );
  }

  const zipFilename = `${sanitizeFilename(cycle.name)}-reports-${new Date().toISOString().slice(0, 10)}.zip`;
  const { html, text } = getReportsExportEmail(cycle.name, subjects.length);

  await sendEmailWithAttachments({
    to: userEmail,
    subject: `${cycle.name} — Report PDFs ready`,
    html,
    text,
    attachments: [
      {
        filename: zipFilename,
        content: zipBuffer,
        contentType: "application/zip",
      },
    ],
  });

  await writeAuditLog({
    companyId,
    userId,
    action: "decryption",
    target: `cycle:${cycleId}`,
    metadata: {
      type: "reports_export",
      subjectCount: subjects.length,
      deliveredTo: userEmail,
      source: "background_job",
    },
  });

  console.log(
    `[Jobs] Reports export complete for cycle ${cycleId}: ${subjects.length} PDFs emailed to ${userEmail}`
  );
}
