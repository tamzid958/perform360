import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { sendEmailWithAttachments } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";

vi.mock("@/lib/reports", () => ({
  buildIndividualReport: vi.fn(),
}));

vi.mock("@/lib/pdf/render-report", () => ({
  renderReportToPdf: vi.fn(),
}));

// Add missing email template functions to the global email mock
vi.mock("@/lib/email", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    getReportsExportEmail: vi.fn().mockReturnValue({ html: "<p>Report</p>", text: "Report" }),
    sendEmailWithAttachments: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue(undefined),
  };
});

// Shared mock functions that every JSZip instance will use
const mockFile = vi.fn();
const mockGenerateAsync = vi.fn();

vi.mock("jszip", () => {
  return {
    default: class MockJSZip {
      file = mockFile;
      generateAsync = mockGenerateAsync;
    },
  };
});

const { buildIndividualReport } = await import("@/lib/reports");
const { renderReportToPdf } = await import("@/lib/pdf/render-report");
const { handleReportsExportCycle } = await import("@/lib/jobs/reports-export");

const PAYLOAD = {
  cycleId: "cycle-1",
  companyId: "company-1",
  userId: "user-1",
  userEmail: "admin@test.com",
  dataKeyHex: Buffer.alloc(32, "k").toString("hex"),
};

describe("handleReportsExportCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when cycle not found", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue(null);

    await expect(handleReportsExportCycle(PAYLOAD)).rejects.toThrow(
      "Cycle not found: cycle-1"
    );
  });

  it("throws when no subjects in cycle", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1 Review",
    } as never);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([]);

    await expect(handleReportsExportCycle(PAYLOAD)).rejects.toThrow(
      "No subjects found in cycle"
    );
  });

  it("builds PDF for each subject and sends ZIP via email", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1 Review",
    } as never);

    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { subjectId: "u1" },
      { subjectId: "u2" },
    ] as never);

    vi.mocked(buildIndividualReport)
      .mockResolvedValueOnce({ subjectName: "Alice" } as never)
      .mockResolvedValueOnce({ subjectName: "Bob" } as never);

    vi.mocked(renderReportToPdf)
      .mockResolvedValueOnce(Buffer.from("pdf-alice"))
      .mockResolvedValueOnce(Buffer.from("pdf-bob"));

    mockGenerateAsync.mockResolvedValue(Buffer.alloc(1000));

    await handleReportsExportCycle(PAYLOAD);

    expect(buildIndividualReport).toHaveBeenCalledTimes(2);
    expect(renderReportToPdf).toHaveBeenCalledTimes(2);
    expect(mockFile).toHaveBeenCalledTimes(2);

    expect(sendEmailWithAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@test.com",
        subject: "Q1 Review — Report PDFs ready",
        attachments: expect.arrayContaining([
          expect.objectContaining({
            contentType: "application/zip",
          }),
        ]),
      })
    );

    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
        action: "decryption",
        metadata: expect.objectContaining({
          type: "reports_export",
          subjectCount: 2,
          deliveredTo: "admin@test.com",
        }),
      })
    );
  });

  it("throws when ZIP exceeds 38 MB limit", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Big Cycle",
    } as never);

    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { subjectId: "u1" },
    ] as never);

    vi.mocked(buildIndividualReport).mockResolvedValue({ subjectName: "Alice" } as never);
    vi.mocked(renderReportToPdf).mockResolvedValue(Buffer.alloc(100));
    mockGenerateAsync.mockResolvedValue(Buffer.alloc(39 * 1024 * 1024));

    await expect(handleReportsExportCycle(PAYLOAD)).rejects.toThrow(
      "exceeding the 40 MB email attachment limit"
    );
  });

  it("sanitizes filenames in ZIP", async () => {
    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: "cycle-1",
      name: "Q1 / Special <Review>",
    } as never);

    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { subjectId: "u1" },
    ] as never);

    vi.mocked(buildIndividualReport).mockResolvedValue({
      subjectName: "John O'Brien (Sales)",
    } as never);
    vi.mocked(renderReportToPdf).mockResolvedValue(Buffer.alloc(100));
    mockGenerateAsync.mockResolvedValue(Buffer.alloc(100));

    await handleReportsExportCycle(PAYLOAD);

    const fileName = mockFile.mock.calls[0][0] as string;
    expect(fileName).not.toMatch(/[/<>()' ]/);
    expect(fileName).toMatch(/\.pdf$/);
  });
});
