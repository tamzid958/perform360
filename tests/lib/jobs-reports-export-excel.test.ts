import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { sendEmailWithAttachments } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";

vi.mock("@/lib/reports", () => ({
  buildIndividualReport: vi.fn(),
  buildCycleReport: vi.fn(),
}));

vi.mock("@/lib/excel/render-cycle-report", () => ({
  renderCycleReportToExcel: vi.fn(),
}));

vi.mock("@/lib/email", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    getReportsExportExcelEmail: vi.fn().mockReturnValue({ html: "<p>Excel</p>", text: "Excel" }),
    sendEmailWithAttachments: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue(undefined),
  };
});

const { buildIndividualReport, buildCycleReport } = await import("@/lib/reports");
const { renderCycleReportToExcel } = await import("@/lib/excel/render-cycle-report");
const { handleReportsExportCycleExcel } = await import("@/lib/jobs/reports-export-excel");

const PAYLOAD = {
  cycleId: "cycle-1",
  companyId: "company-1",
  userId: "user-1",
  userEmail: "admin@test.com",
  dataKeyHex: Buffer.alloc(32, "k").toString("hex"),
};

describe("handleReportsExportCycleExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when cycle not found", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue(null);

    await expect(handleReportsExportCycleExcel(PAYLOAD)).rejects.toThrow(
      "Cycle not found: cycle-1"
    );
  });

  it("throws when no subjects in cycle", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1",
    } as never);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([]);

    await expect(handleReportsExportCycleExcel(PAYLOAD)).rejects.toThrow(
      "No subjects found in cycle"
    );
  });

  it("builds reports and sends Excel via email", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1 Review",
    } as never);

    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { subjectId: "u1" },
      { subjectId: "u2" },
    ] as never);

    vi.mocked(buildCycleReport).mockResolvedValue({ cycleName: "Q1 Review" } as never);
    vi.mocked(buildIndividualReport)
      .mockResolvedValueOnce({ subjectName: "Alice" } as never)
      .mockResolvedValueOnce({ subjectName: "Bob" } as never);
    vi.mocked(renderCycleReportToExcel).mockResolvedValue(Buffer.alloc(5000));

    await handleReportsExportCycleExcel(PAYLOAD);

    expect(buildCycleReport).toHaveBeenCalledWith(
      "cycle-1",
      "company-1",
      expect.any(Buffer)
    );
    expect(buildIndividualReport).toHaveBeenCalledTimes(2);
    expect(renderCycleReportToExcel).toHaveBeenCalledTimes(1);

    expect(sendEmailWithAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@test.com",
        subject: "Q1 Review — Excel Scores Report",
        attachments: expect.arrayContaining([
          expect.objectContaining({
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        ]),
      })
    );

    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "decryption",
        metadata: expect.objectContaining({
          type: "reports_export_excel",
          subjectCount: 2,
        }),
      })
    );
  });

  it("throws when Excel exceeds 38 MB limit", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1",
    } as never);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { subjectId: "u1" },
    ] as never);
    vi.mocked(buildCycleReport).mockResolvedValue({} as never);
    vi.mocked(buildIndividualReport).mockResolvedValue({ subjectName: "A" } as never);
    vi.mocked(renderCycleReportToExcel).mockResolvedValue(
      Buffer.alloc(39 * 1024 * 1024)
    );

    await expect(handleReportsExportCycleExcel(PAYLOAD)).rejects.toThrow(
      "exceeding the 40 MB email attachment limit"
    );
  });

  it("uses sanitized filename for attachment", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1 / Special <Review>",
    } as never);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { subjectId: "u1" },
    ] as never);
    vi.mocked(buildCycleReport).mockResolvedValue({} as never);
    vi.mocked(buildIndividualReport).mockResolvedValue({ subjectName: "A" } as never);
    vi.mocked(renderCycleReportToExcel).mockResolvedValue(Buffer.alloc(100));

    await handleReportsExportCycleExcel(PAYLOAD);

    const attachment = vi.mocked(sendEmailWithAttachments).mock.calls[0][0].attachments[0];
    expect(attachment.filename).not.toMatch(/[/<> ]/);
    expect(attachment.filename).toMatch(/\.xlsx$/);
  });
});
