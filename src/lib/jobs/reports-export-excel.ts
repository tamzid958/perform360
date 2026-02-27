import { prisma } from "@/lib/prisma";
import { buildIndividualReport, buildCycleReport } from "@/lib/reports";
import { renderCycleReportToExcel } from "@/lib/excel/render-cycle-report";
import { getReportsExportExcelEmail, sendEmailWithAttachments } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import type { ReportsExportCycleExcelPayload } from "@/types/job";

const MAX_ATTACHMENT_BYTES = 38 * 1024 * 1024; // 38 MB (Resend limit is 40 MB)

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
}

export async function handleReportsExportCycleExcel(
  payload: ReportsExportCycleExcelPayload,
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

  // Build cycle-level aggregate report
  const cycleReport = await buildCycleReport(cycleId, companyId, dataKey);

  // Build individual reports sequentially to limit peak memory
  const individualReports = [];
  for (const { subjectId } of subjects) {
    const report = await buildIndividualReport(cycleId, subjectId, companyId, dataKey);
    individualReports.push(report);
  }

  const excelBuffer = await renderCycleReportToExcel(
    cycleReport,
    individualReports,
    cycle.name,
  );

  if (excelBuffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `Excel file is ${(excelBuffer.length / 1024 / 1024).toFixed(1)} MB, ` +
      `exceeding the 40 MB email attachment limit.`,
    );
  }

  const filename = `${sanitizeFilename(cycle.name)}-scores-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const { html, text } = getReportsExportExcelEmail(cycle.name, subjects.length);

  await sendEmailWithAttachments({
    to: userEmail,
    subject: `${cycle.name} — Excel Scores Report`,
    html,
    text,
    attachments: [
      {
        filename,
        content: excelBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  await writeAuditLog({
    companyId,
    userId,
    action: "decryption",
    target: `cycle:${cycleId}`,
    metadata: {
      type: "reports_export_excel",
      subjectCount: subjects.length,
      deliveredTo: userEmail,
      source: "background_job",
    },
  });

  console.log(
    `[Jobs] Excel export complete for cycle ${cycleId}: ${subjects.length} subjects emailed to ${userEmail}`,
  );
}
