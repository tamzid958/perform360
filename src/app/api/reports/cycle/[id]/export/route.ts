import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildIndividualReport, buildCycleReport } from "@/lib/reports";
import { getDataKeyFromRequest } from "@/lib/encryption-session";
import { RELATIONSHIP_LABELS } from "@/lib/constants";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuidParam } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import type { RelationshipScores } from "@/types/report";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Export cycle report as a structured JSON blob suitable for client-side PDF generation.
 * The client renders this into a PDF using the browser's print/PDF capabilities.
 *
 * Query params:
 *   ?userId=xxx — export individual report for a specific user
 *   (no userId) — export cycle aggregate + all individual reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;
  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const { id: cycleId } = params;
  const { companyId } = authResult;

  // Verify cycle belongs to user's company
  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, companyId },
    select: { id: true, name: true },
  });

  if (!cycle) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Cycle not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const dataKey = getDataKeyFromRequest(request);
  if (!dataKey) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Encryption locked. Enter your passphrase to export reports.", code: "ENCRYPTION_LOCKED" },
      { status: 403 }
    );
  }

  const userId = request.nextUrl.searchParams.get("userId");

  try {
    if (userId) {
      // Single individual report export
      const subject = await prisma.user.findFirst({
        where: { id: userId, companyId },
        select: { id: true },
      });

      if (!subject) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: "User not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      const report = await buildIndividualReport(cycleId, userId, companyId, dataKey);

      await writeAuditLog({
        companyId,
        userId: authResult.userId,
        action: "decryption",
        target: `cycle:${cycleId}`,
        metadata: { type: "export", exportedUserId: userId },
      });

      const html = renderIndividualReportHtml(report, cycle.name);

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${sanitizeFilename(report.subjectName)}-${sanitizeFilename(cycle.name)}.html"`,
        },
      });
    }

    // Full cycle export — aggregate report
    await writeAuditLog({
      companyId,
      userId: authResult.userId,
      action: "decryption",
      target: `cycle:${cycleId}`,
      metadata: { type: "full_cycle_export" },
    });

    const cycleReport = await buildCycleReport(cycleId, companyId, dataKey);

    // Get all unique subjects in this cycle
    const subjects = await prisma.evaluationAssignment.findMany({
      where: { cycleId },
      select: { subjectId: true },
      distinct: ["subjectId"],
    });

    const individualReports = await Promise.all(
      subjects.map((s) => buildIndividualReport(cycleId, s.subjectId, companyId, dataKey))
    );

    const html = renderCycleExportHtml(cycleReport, individualReports, cycle.name);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${sanitizeFilename(cycle.name)}-report.html"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Failed to export report";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── HTML Report Rendering ───

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
}

function renderScoreSection(
  data: {
    overallScore: number;
    categoryScores: { category: string; score: number; maxScore: number }[];
    scoresByRelationship: RelationshipScores;
    textFeedback: { relationship: string; questionText: string; responses: string[] }[];
  },
  relLabels: Record<string, string>
): string {
  const categoryRows = data.categoryScores
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.category)}</td><td>${c.score.toFixed(1)}</td><td>${c.maxScore}</td></tr>`
    )
    .join("");

  const relEntries: [string, number | null][] = [
    ["manager", data.scoresByRelationship.manager],
    ["peer", data.scoresByRelationship.peer],
    ["directReport", data.scoresByRelationship.directReport],
    ["self", data.scoresByRelationship.self],
  ];
  const relationshipRows = relEntries
    .filter(([, v]) => v !== null)
    .map(
      ([key, value]) =>
        `<tr><td>${escapeHtml(relLabels[key] ?? key)}</td><td>${(value as number).toFixed(1)}</td></tr>`
    )
    .join("");

  const feedbackSections = data.textFeedback
    .map(
      (group) => `
      <div class="feedback-group">
        <h4>${escapeHtml(relLabels[group.relationship] ?? group.relationship)} — ${escapeHtml(group.questionText)}</h4>
        <ul>${group.responses.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
      </div>`
    )
    .join("");

  return `
  <div class="score-hero">
    <div class="score-value">${data.overallScore.toFixed(1)}</div>
    <div class="score-label">Overall Score</div>
  </div>

  <section>
    <h2>Scores by Relationship</h2>
    <table><thead><tr><th>Relationship</th><th>Avg Score</th></tr></thead>
    <tbody>${relationshipRows}</tbody></table>
  </section>

  <section>
    <h2>Competency Scores</h2>
    <table><thead><tr><th>Category</th><th>Score</th><th>Max</th></tr></thead>
    <tbody>${categoryRows}</tbody></table>
  </section>

  ${
    feedbackSections
      ? `<section><h2>Open Feedback</h2>${feedbackSections}</section>`
      : ""
  }`;
}

function renderIndividualReportHtml(
  report: Awaited<ReturnType<typeof buildIndividualReport>>,
  cycleName: string
): string {
  const relLabels: Record<string, string> = RELATIONSHIP_LABELS;

  const hasTeamBreakdowns = report.teamBreakdowns.length > 1;

  const allTeamsHeading = hasTeamBreakdowns
    ? `<div class="team-divider"><h2 class="team-heading">All Teams (Merged)</h2></div>`
    : "";

  const mergedSection = renderScoreSection(report, relLabels);

  const teamSections = hasTeamBreakdowns
    ? report.teamBreakdowns
        .map(
          (tb) => `
          <div class="team-divider page-break">
            <h2 class="team-heading">${escapeHtml(tb.teamName)}</h2>
          </div>
          ${renderScoreSection(tb, relLabels)}`
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(report.subjectName)} — ${escapeHtml(cycleName)}</title>
<style>${reportCss}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>${escapeHtml(report.subjectName)}</h1>
    <p class="subtitle">${escapeHtml(cycleName)}</p>
  </header>

  ${allTeamsHeading}
  ${mergedSection}
  ${teamSections}

  <footer>
    <p>Generated by Performs360 &middot; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </footer>
</div>
</body>
</html>`;
}

function renderCycleExportHtml(
  cycleReport: Awaited<ReturnType<typeof buildCycleReport>>,
  individuals: Awaited<ReturnType<typeof buildIndividualReport>>[],
  cycleName: string
): string {
  const teamRows = cycleReport.teamCompletionRates
    .map(
      (t) =>
        `<tr><td>${escapeHtml(t.teamName)}</td><td>${t.completed}/${t.total}</td><td>${t.rate.toFixed(1)}%</td></tr>`
    )
    .join("");

  const sortedIndividuals = individuals.sort((a, b) => b.overallScore - a.overallScore);

  const participantRows = sortedIndividuals
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.subjectName)}</td><td>${r.overallScore.toFixed(1)}</td></tr>`
    )
    .join("");

  const relLabels: Record<string, string> = RELATIONSHIP_LABELS;

  const individualSections = sortedIndividuals
    .map((report) => {
      const hasTeamBreakdowns = report.teamBreakdowns.length > 1;

      const allTeamsHeading = hasTeamBreakdowns
        ? `<div class="team-divider"><h2 class="team-heading">All Teams (Merged)</h2></div>`
        : "";

      const mergedSection = renderScoreSection(report, relLabels);

      const teamSections = hasTeamBreakdowns
        ? report.teamBreakdowns
            .map(
              (tb) => `
              <div class="team-divider">
                <h2 class="team-heading">${escapeHtml(tb.teamName)}</h2>
              </div>
              ${renderScoreSection(tb, relLabels)}`
            )
            .join("")
        : "";

      return `
      <div class="individual-report page-break">
        <header>
          <h1>${escapeHtml(report.subjectName)}</h1>
          <p class="subtitle">${escapeHtml(cycleName)}</p>
        </header>
        ${allTeamsHeading}
        ${mergedSection}
        ${teamSections}
      </div>`;
    })
    .join("");

  const stats = cycleReport.participationStats;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(cycleName)} — Cycle Report</title>
<style>${reportCss}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>${escapeHtml(cycleName)}</h1>
    <p class="subtitle">Cycle Report</p>
  </header>

  <section class="stats-grid">
    <div class="stat"><div class="stat-value">${cycleReport.completionRate.toFixed(1)}%</div><div class="stat-label">Completion</div></div>
    <div class="stat"><div class="stat-value">${stats.completedAssignments}</div><div class="stat-label">Completed</div></div>
    <div class="stat"><div class="stat-value">${stats.pendingAssignments}</div><div class="stat-label">Pending</div></div>
    <div class="stat"><div class="stat-value">${stats.totalAssignments}</div><div class="stat-label">Total</div></div>
  </section>

  <section>
    <h2>Team Completion</h2>
    <table><thead><tr><th>Team</th><th>Progress</th><th>Rate</th></tr></thead>
    <tbody>${teamRows}</tbody></table>
  </section>

  <section>
    <h2>Individual Scores</h2>
    <table><thead><tr><th>Name</th><th>Overall Score</th></tr></thead>
    <tbody>${participantRows}</tbody></table>
  </section>
</div>

${individualSections}

<div class="container">
  <footer>
    <p>Generated by Performs360 &middot; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </footer>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const reportCss = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif; color: #1d1d1f; background: #fff; }
  .container { max-width: 800px; margin: 0 auto; padding: 48px 32px; }
  header { margin-bottom: 32px; text-align: center; }
  h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.01em; }
  .subtitle { font-size: 15px; color: #86868b; margin-top: 4px; }
  h2 { font-size: 20px; font-weight: 600; margin-bottom: 12px; margin-top: 32px; }
  h4 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
  .score-hero { text-align: center; margin: 24px 0 32px; }
  .score-value { font-size: 48px; font-weight: 700; color: #0071e3; }
  .score-label { font-size: 14px; color: #86868b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { padding: 10px 16px; text-align: left; border-bottom: 1px solid #e8e8ed; font-size: 14px; }
  th { font-weight: 600; color: #48484a; background: #f5f5f7; }
  .feedback-group { margin-bottom: 16px; padding: 12px; background: #f5f5f7; border-radius: 12px; }
  .feedback-group ul { padding-left: 20px; }
  .feedback-group li { margin-bottom: 6px; font-size: 14px; color: #48484a; line-height: 1.5; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
  .stat { text-align: center; padding: 16px; background: #f5f5f7; border-radius: 12px; }
  .stat-value { font-size: 24px; font-weight: 700; }
  .stat-label { font-size: 12px; color: #86868b; margin-top: 4px; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8e8ed; text-align: center; }
  footer p { font-size: 12px; color: #a1a1a6; }
  .individual-report { max-width: 800px; margin: 0 auto; padding: 48px 32px; }
  .individual-report header { margin-bottom: 32px; text-align: center; }
  .team-divider { margin-top: 40px; padding-top: 24px; border-top: 2px solid #e8e8ed; }
  .team-heading { font-size: 22px; font-weight: 700; color: #1d1d1f; margin-bottom: 0; }
  @media print {
    body { background: #fff; }
    .container { padding: 0; max-width: 100%; }
    .page-break { page-break-before: always; }
    @page { margin: 1in; }
  }
`;
