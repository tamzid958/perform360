import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Un-mock queue so we test the real implementation
vi.unmock("@/lib/queue");

const {
  enqueue,
  enqueueBatch,
  dequeue,
  complete,
  fail,
  getJobStatus,
  recoverStaleJobs,
  pruneOldJobs,
  hasPendingJob,
} = await import("@/lib/queue");

describe("enqueue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a job with default options", async () => {
    vi.mocked(prisma.jobQueue.create).mockResolvedValue({ id: "job-1" } as any);

    const id = await enqueue("email.send", {
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(id).toBe("job-1");
    expect(prisma.jobQueue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "email.send",
        payload: expect.objectContaining({ to: "test@example.com" }),
        priority: 0,
        maxAttempts: 3,
      }),
    });
  });

  it("respects custom priority and maxAttempts", async () => {
    vi.mocked(prisma.jobQueue.create).mockResolvedValue({ id: "job-2" } as any);

    await enqueue(
      "email.send",
      { to: "a@b.com", subject: "S", html: "", text: "" },
      { priority: 5, maxAttempts: 1 }
    );

    expect(prisma.jobQueue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priority: 5,
        maxAttempts: 1,
      }),
    });
  });

  it("respects custom runAt", async () => {
    vi.mocked(prisma.jobQueue.create).mockResolvedValue({ id: "job-3" } as any);

    const futureDate = new Date("2026-12-01T00:00:00Z");
    await enqueue(
      "email.send",
      { to: "a@b.com", subject: "S", html: "", text: "" },
      { runAt: futureDate }
    );

    expect(prisma.jobQueue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ runAt: futureDate }),
    });
  });
});

describe("enqueueBatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates multiple jobs in a transaction", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: "j1" },
      { id: "j2" },
    ] as any);

    const ids = await enqueueBatch([
      { type: "email.send", payload: { to: "a@b.com", subject: "A", html: "", text: "" } },
      { type: "email.send", payload: { to: "c@d.com", subject: "B", html: "", text: "" } },
    ]);

    expect(ids).toEqual(["j1", "j2"]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("returns empty array for empty input", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any);

    const ids = await enqueueBatch([]);
    expect(ids).toEqual([]);
  });
});

describe("dequeue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a job when one is available", async () => {
    const mockJob = {
      id: "job-1",
      type: "email.send",
      status: "PROCESSING",
      attempts: 1,
      maxAttempts: 3,
      payload: {},
    };
    vi.mocked(prisma.$queryRaw).mockResolvedValue([mockJob]);

    const result = await dequeue();
    expect(result).toEqual(mockJob);
  });

  it("returns null when no jobs available", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const result = await dequeue();
    expect(result).toBeNull();
  });

  it("filters by job types when provided", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await dequeue(["email.send", "cycle.activate"]);

    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});

describe("complete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks job as COMPLETED with timestamp", async () => {
    vi.mocked(prisma.jobQueue.update).mockResolvedValue({} as any);

    await complete("job-1");

    expect(prisma.jobQueue.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "COMPLETED",
        completedAt: expect.any(Date),
      },
    });
  });
});

describe("fail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks job as DEAD when attempts exhausted", async () => {
    vi.mocked(prisma.jobQueue.update).mockResolvedValue({} as any);

    await fail("job-1", "Connection timeout", 3, 3);

    expect(prisma.jobQueue.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "DEAD",
        lastError: "Connection timeout",
        completedAt: expect.any(Date),
      },
    });
  });

  it("retries with PENDING status and exponential backoff when attempts remain", async () => {
    vi.mocked(prisma.jobQueue.update).mockResolvedValue({} as any);

    await fail("job-1", "Timeout", 1, 3);

    expect(prisma.jobQueue.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "PENDING",
        lastError: "Timeout",
        runAt: expect.any(Date),
      },
    });
  });

  it("truncates long error messages to 2000 chars", async () => {
    vi.mocked(prisma.jobQueue.update).mockResolvedValue({} as any);

    const longError = "x".repeat(3000);
    await fail("job-1", longError, 3, 3);

    const callArgs = vi.mocked(prisma.jobQueue.update).mock.calls[0][0];
    expect((callArgs.data as any).lastError).toHaveLength(2000);
  });
});

describe("getJobStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns job status by ID", async () => {
    const mockStatus = {
      id: "job-1",
      type: "email.send",
      status: "COMPLETED",
      lastError: null,
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date(),
      completedAt: new Date(),
    };
    vi.mocked(prisma.jobQueue.findUnique).mockResolvedValue(mockStatus as any);

    const result = await getJobStatus("job-1");
    expect(result).toEqual(mockStatus);
  });

  it("returns null for non-existent job", async () => {
    vi.mocked(prisma.jobQueue.findUnique).mockResolvedValue(null);

    const result = await getJobStatus("nonexistent");
    expect(result).toBeNull();
  });
});

describe("recoverStaleJobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resets stale PROCESSING jobs to PENDING", async () => {
    vi.mocked(prisma.jobQueue.updateMany).mockResolvedValue({ count: 3 } as any);

    const count = await recoverStaleJobs();
    expect(count).toBe(3);

    expect(prisma.jobQueue.updateMany).toHaveBeenCalledWith({
      where: {
        status: "PROCESSING",
        startedAt: { lt: expect.any(Date) },
      },
      data: {
        status: "PENDING",
        lastError: expect.stringContaining("stale"),
      },
    });
  });

  it("returns 0 when no stale jobs", async () => {
    vi.mocked(prisma.jobQueue.updateMany).mockResolvedValue({ count: 0 } as any);

    const count = await recoverStaleJobs();
    expect(count).toBe(0);
  });
});

describe("pruneOldJobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes old COMPLETED and DEAD jobs", async () => {
    vi.mocked(prisma.jobQueue.deleteMany).mockResolvedValue({ count: 10 } as any);

    const count = await pruneOldJobs();
    expect(count).toBe(10);

    expect(prisma.jobQueue.deleteMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["COMPLETED", "DEAD"] },
        createdAt: { lt: expect.any(Date) },
      },
    });
  });

  it("respects custom retention days", async () => {
    vi.mocked(prisma.jobQueue.deleteMany).mockResolvedValue({ count: 0 } as any);

    await pruneOldJobs(30);

    const callArgs = vi.mocked(prisma.jobQueue.deleteMany).mock.calls[0][0]!;
    const cutoffDate = (callArgs.where as any).createdAt.lt as Date;
    const daysDiff = (Date.now() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeCloseTo(30, 0);
  });
});

describe("hasPendingJob", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when pending job exists", async () => {
    vi.mocked(prisma.jobQueue.findFirst).mockResolvedValue({ id: "job-1" } as any);

    const result = await hasPendingJob("email.send");
    expect(result).toBe(true);
  });

  it("returns false when no pending job exists", async () => {
    vi.mocked(prisma.jobQueue.findFirst).mockResolvedValue(null);

    const result = await hasPendingJob("email.send");
    expect(result).toBe(false);

    expect(prisma.jobQueue.findFirst).toHaveBeenCalledWith({
      where: {
        type: "email.send",
        status: { in: ["PENDING", "PROCESSING"] },
      },
      select: { id: true },
    });
  });
});
