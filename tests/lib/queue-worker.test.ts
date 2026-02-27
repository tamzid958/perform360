import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorker } from "@/lib/queue-worker";
import { dequeue, complete, fail, recoverStaleJobs } from "@/lib/queue";
import type { JobHandler, JobRow } from "@/types/job";

// The setup.ts mocks queue globally; override specific fns per test
vi.mock("@/lib/queue", async () => ({
  dequeue: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  recoverStaleJobs: vi.fn().mockResolvedValue(0),
}));

function makeJob(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: "job-1",
    type: "email.send",
    status: "PROCESSING",
    payload: { to: "a@b.com", subject: "Hi", html: "", text: "" },
    attempts: 1,
    maxAttempts: 3,
    priority: 0,
    lastError: null,
    runAt: new Date(),
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as JobRow;
}

describe("createWorker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("processes a job and marks it complete", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const handlers = new Map<string, JobHandler<never>>([
      ["email.send", handler],
    ]);

    const job = makeJob();
    vi.mocked(dequeue)
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);

    const worker = createWorker(handlers, { pollIntervalMs: 10 });

    // Start and stop after first cycle
    const startPromise = worker.start();
    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith(job.payload, job.id);
    }, { timeout: 2000 });

    await worker.stop();
    await startPromise;

    expect(complete).toHaveBeenCalledWith("job-1");
  });

  it("fails unknown job types", async () => {
    const handlers = new Map<string, JobHandler<never>>();
    const job = makeJob({ type: "unknown.type" as any });

    vi.mocked(dequeue)
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);

    const worker = createWorker(handlers, { pollIntervalMs: 10 });
    const startPromise = worker.start();

    await vi.waitFor(() => {
      expect(fail).toHaveBeenCalledWith(
        "job-1",
        expect.stringContaining("Unknown job type"),
        1,
        3
      );
    }, { timeout: 2000 });

    await worker.stop();
    await startPromise;
  });

  it("calls fail when handler throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("DB down"));
    const handlers = new Map<string, JobHandler<never>>([
      ["email.send", handler],
    ]);

    const job = makeJob();
    vi.mocked(dequeue)
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);

    const worker = createWorker(handlers, { pollIntervalMs: 10 });
    const startPromise = worker.start();

    await vi.waitFor(() => {
      expect(fail).toHaveBeenCalledWith("job-1", "DB down", 1, 3);
    }, { timeout: 2000 });

    await worker.stop();
    await startPromise;
  });

  it("recovers stale jobs on start", async () => {
    vi.mocked(recoverStaleJobs).mockResolvedValue(5);
    vi.mocked(dequeue).mockResolvedValue(null);

    const handlers = new Map<string, JobHandler<never>>();
    const worker = createWorker(handlers, { pollIntervalMs: 10 });

    const startPromise = worker.start();
    await vi.waitFor(() => {
      expect(recoverStaleJobs).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    await worker.stop();
    await startPromise;
  });

  it("continues polling after dequeue errors", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const handlers = new Map<string, JobHandler<never>>([
      ["email.send", handler],
    ]);
    const job = makeJob();

    vi.mocked(dequeue)
      .mockRejectedValueOnce(new Error("DB unavailable"))
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);

    const worker = createWorker(handlers, { pollIntervalMs: 10 });
    const startPromise = worker.start();

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    await worker.stop();
    await startPromise;
  });
});
