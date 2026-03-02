import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { enqueueBatch } from "@/lib/queue";
import { sendEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";

const { handleCycleActivate, handleCycleRemind, handleCycleAutoClose } =
  await import("@/lib/jobs/cycle");
const { handleEmailSend } = await import("@/lib/jobs/email");
const { handleCleanupOtpSessions } = await import("@/lib/jobs/cleanup");

describe("Job: handleEmailSend", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends email with correct params", async () => {
    await handleEmailSend({
      to: "user@test.com",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: "user@test.com",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  });
});

describe("Job: handleCycleActivate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches assignments and enqueues email jobs", async () => {
    vi.mocked(prisma.evaluationCycle.findUnique).mockResolvedValue({
      name: "Q1 2026",
    } as any);

    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { id: "a1", token: "tok1", subjectId: "s1", reviewerId: "r1" },
    ] as any);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "r1", email: "reviewer@test.com", name: "Reviewer" },
      { id: "s1", email: "subject@test.com", name: "Subject" },
    ] as any);

    await handleCycleActivate({
      cycleId: "cycle-1",
      companyId: "co-1",
      userId: "u1",
      cachedDataKeyEncrypted: "key",
    });

    expect(enqueueBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({ to: "reviewer@test.com" }),
        }),
      ])
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "cycle_activate" })
    );
  });

  it("throws if cycle not found", async () => {
    vi.mocked(prisma.evaluationCycle.findUnique).mockResolvedValue(null);

    await expect(
      handleCycleActivate({
        cycleId: "bad",
        companyId: "co-1",
        userId: "u1",
        cachedDataKeyEncrypted: "key",
      })
    ).rejects.toThrow("Cycle not found");
  });

  it("returns early when no assignments exist", async () => {
    vi.mocked(prisma.evaluationCycle.findUnique).mockResolvedValue({
      name: "Q1",
    } as any);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([]);

    await handleCycleActivate({
      cycleId: "c1",
      companyId: "co-1",
      userId: "u1",
      cachedDataKeyEncrypted: "key",
    });

    expect(enqueueBatch).not.toHaveBeenCalled();
  });
});

describe("Job: handleCycleRemind", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends reminders for pending assignments", async () => {
    vi.mocked(prisma.evaluationCycle.findUnique).mockResolvedValue({
      name: "Q1 2026",
      endDate: new Date("2026-04-01"),
      status: "ACTIVE",
    } as any);

    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { token: "tok1", reviewerId: "r1", subjectId: "s1" },
    ] as any);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "r1", email: "reviewer@test.com", name: "Reviewer" },
      { id: "s1", email: "subject@test.com", name: "Subject" },
    ] as any);

    await handleCycleRemind({ cycleId: "c1", companyId: "co-1" });

    expect(enqueueBatch).toHaveBeenCalled();
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "cycle_remind" })
    );
  });

  it("skips non-ACTIVE cycle", async () => {
    vi.mocked(prisma.evaluationCycle.findUnique).mockResolvedValue({
      name: "Q1",
      status: "CLOSED",
    } as any);

    await handleCycleRemind({ cycleId: "c1", companyId: "co-1" });

    expect(prisma.evaluationAssignment.findMany).not.toHaveBeenCalled();
  });
});

describe("Job: handleCycleAutoClose", () => {
  beforeEach(() => vi.clearAllMocks());

  it("closes overdue ACTIVE cycles", async () => {
    vi.mocked(prisma.evaluationCycle.findMany).mockResolvedValue([
      { id: "c1", companyId: "co-1", name: "Q1" },
      { id: "c2", companyId: "co-2", name: "Q2" },
    ] as any);

    vi.mocked(prisma.evaluationCycle.update).mockResolvedValue({} as any);

    await handleCycleAutoClose({});

    expect(prisma.evaluationCycle.update).toHaveBeenCalledTimes(2);
    expect(writeAuditLog).toHaveBeenCalledTimes(2);
  });

  it("does nothing when no overdue cycles", async () => {
    vi.mocked(prisma.evaluationCycle.findMany).mockResolvedValue([]);

    await handleCycleAutoClose({});

    expect(prisma.evaluationCycle.update).not.toHaveBeenCalled();
  });
});

describe("Job: handleCleanupOtpSessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes expired sessions and OTPs", async () => {
    vi.mocked(prisma.otpSession.deleteMany)
      .mockResolvedValueOnce({ count: 3 } as any)
      .mockResolvedValueOnce({ count: 5 } as any);

    await handleCleanupOtpSessions({});

    expect(prisma.otpSession.deleteMany).toHaveBeenCalledTimes(2);
  });
});
