import PDFDocument from "pdfkit";
import type {
  IndividualReport,
  CategoryScore,
  RelationshipScores,
  TextFeedbackGroup,
  TeamBreakdown,
} from "@/types/report";

const RELATIONSHIP_DISPLAY: Record<string, string> = {
  manager: "Manager",
  peer: "Peer",
  directReport: "Direct Report",
  self: "Self",
  external: "External",
};

const COLORS = {
  primary: "#0071e3",
  heading: "#1d1d1f",
  body: "#48484a",
  muted: "#86868b",
  light: "#a1a1a6",
  tableBg: "#f5f5f7",
  border: "#e8e8ed",
} as const;

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2; // Letter width minus margins

export async function renderReportToPdf(
  report: IndividualReport,
  cycleName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: PAGE_MARGIN,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderHeader(doc, report.subjectName, cycleName);
    renderOverallScore(doc, report);
    renderRelationshipScores(doc, report.scoresByRelationship);
    renderCategoryScores(doc, report.categoryScores);
    renderTextFeedback(doc, report.textFeedback);

    if (report.teamBreakdowns.length > 1) {
      for (const tb of report.teamBreakdowns) {
        doc.addPage();
        renderTeamBreakdown(doc, tb, cycleName);
      }
    }

    renderFooter(doc);
    doc.end();
  });
}

// ─── Layout Helpers ───

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  const remaining = doc.page.height - PAGE_MARGIN - doc.y;
  if (remaining < needed) {
    doc.addPage();
    doc.x = PAGE_MARGIN;
  }
}

function resetCursor(doc: PDFKit.PDFDocument): void {
  doc.x = PAGE_MARGIN;
}

function renderHeader(
  doc: PDFKit.PDFDocument,
  name: string,
  cycleName: string
): void {
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(COLORS.heading)
    .text(name, { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(COLORS.muted)
    .text(cycleName, { align: "center" });
  doc.moveDown(1.5);
}

function renderOverallScore(
  doc: PDFKit.PDFDocument,
  report: { overallScore: number; weightedOverallScore?: number | null }
): void {
  const displayScore = report.weightedOverallScore ?? report.overallScore;
  const label = report.weightedOverallScore != null
    ? "Overall Score (Weighted)"
    : "Overall Score";

  doc
    .font("Helvetica-Bold")
    .fontSize(42)
    .fillColor(COLORS.primary)
    .text(displayScore.toFixed(1), { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(COLORS.muted)
    .text(label, { align: "center" });

  if (report.weightedOverallScore != null) {
    doc
      .fontSize(10)
      .fillColor(COLORS.light)
      .text(`Unweighted: ${report.overallScore.toFixed(1)}`, { align: "center" });
  }

  doc.moveDown(1.5);
}

function renderRelationshipScores(
  doc: PDFKit.PDFDocument,
  scores: RelationshipScores
): void {
  const entries: [string, number | null][] = [
    ["manager", scores.manager],
    ["peer", scores.peer],
    ["directReport", scores.directReport],
    ["self", scores.self],
    ["external", scores.external],
  ];
  const filtered = entries.filter(([, v]) => v !== null) as [string, number][];

  if (filtered.length === 0) return;

  ensureSpace(doc, 40 + filtered.length * 24);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.heading)
    .text("Scores by Relationship");
  doc.moveDown(0.5);

  drawTable(
    doc,
    ["Relationship", "Avg Score"],
    filtered.map(([key, value]) => [
      RELATIONSHIP_DISPLAY[key] ?? key,
      value.toFixed(1),
    ]),
    [CONTENT_WIDTH * 0.65, CONTENT_WIDTH * 0.35]
  );
  resetCursor(doc);

  doc.moveDown(1);
}

function renderCategoryScores(
  doc: PDFKit.PDFDocument,
  categories: CategoryScore[]
): void {
  if (categories.length === 0) return;

  ensureSpace(doc, 40 + categories.length * 24);
  resetCursor(doc);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.heading)
    .text("Competency Scores");
  doc.moveDown(0.5);

  drawTable(
    doc,
    ["Category", "Score", "Max"],
    categories.map((c) => [c.category, c.score.toFixed(1), String(c.maxScore)]),
    [CONTENT_WIDTH * 0.55, CONTENT_WIDTH * 0.225, CONTENT_WIDTH * 0.225]
  );
  resetCursor(doc);

  doc.moveDown(1);
}

function renderTextFeedback(
  doc: PDFKit.PDFDocument,
  feedback: TextFeedbackGroup[]
): void {
  if (feedback.length === 0) return;

  ensureSpace(doc, 60);
  resetCursor(doc);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.heading)
    .text("Open Feedback", PAGE_MARGIN, undefined, { width: CONTENT_WIDTH });
  doc.moveDown(0.5);

  for (const group of feedback) {
    if (group.responses.length === 0) continue;

    ensureSpace(doc, 50);
    resetCursor(doc);

    const relLabel = RELATIONSHIP_DISPLAY[group.relationship] ?? group.relationship;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.body)
      .text(`${relLabel} — ${group.questionText}`, PAGE_MARGIN, undefined, { width: CONTENT_WIDTH });
    doc.moveDown(0.3);

    for (const response of group.responses) {
      ensureSpace(doc, 30);
      resetCursor(doc);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(COLORS.body)
        .text(`  \u2022  ${response}`, PAGE_MARGIN + 8, undefined, {
          width: CONTENT_WIDTH - 16,
          lineGap: 2,
        });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);
  }
}

function renderTeamBreakdown(
  doc: PDFKit.PDFDocument,
  tb: TeamBreakdown,
  _cycleName: string
): void {
  resetCursor(doc);
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.heading)
    .text(tb.teamName, PAGE_MARGIN, undefined, { width: CONTENT_WIDTH });
  doc.moveDown(0.5);

  renderOverallScore(doc, tb);
  renderRelationshipScores(doc, tb.scoresByRelationship);
  renderCategoryScores(doc, tb.weightedCategoryScores ?? tb.categoryScores);
  renderTextFeedback(doc, tb.textFeedback);
}

function renderFooter(doc: PDFKit.PDFDocument): void {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.light)
      .text(
        `Generated by Performs360 \u00B7 ${dateStr}`,
        PAGE_MARGIN,
        doc.page.height - 35,
        { align: "center", width: CONTENT_WIDTH }
      );
  }
}

// ─── Table Drawing ───

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[]
): void {
  const rowHeight = 24;
  const cellPadding = 8;
  const startX = PAGE_MARGIN;

  // Header row
  let y = doc.y;
  doc.rect(startX, y, CONTENT_WIDTH, rowHeight).fill(COLORS.tableBg);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.body);
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + cellPadding, y + 7, {
      width: colWidths[i] - cellPadding * 2,
    });
    x += colWidths[i];
  }
  y += rowHeight;

  // Data rows
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.heading);
  for (let r = 0; r < rows.length; r++) {
    ensureSpace(doc, rowHeight + 4);
    y = doc.y;

    if (r % 2 === 1) {
      doc.rect(startX, y, CONTENT_WIDTH, rowHeight).fill(COLORS.tableBg);
      doc.fillColor(COLORS.heading);
    }

    // Border bottom
    doc
      .moveTo(startX, y + rowHeight)
      .lineTo(startX + CONTENT_WIDTH, y + rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    x = startX;
    for (let c = 0; c < rows[r].length; c++) {
      doc.text(rows[r][c], x + cellPadding, y + 7, {
        width: colWidths[c] - cellPadding * 2,
      });
      x += colWidths[c];
    }
    doc.y = y + rowHeight;
  }
  doc.x = PAGE_MARGIN;
  doc.y += 4;
}
