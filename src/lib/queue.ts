import { prisma } from "./prisma";
import { JOB_CONFIG } from "./constants";
import type {
  JobType,
  JobPayloadMap,
  EnqueueOptions,
  JobRow,
} from "@/types/job";

/**
 * Enqueue a single job. Returns the created job ID.
 */
export async function enqueue<T extends JobType>(
  type: T,
  payload: JobPayloadMap[T],
  options?: EnqueueOptions
): Promise<string> {
  const job = await prisma.jobQueue.create({
    data: {
      type,
      payload: payload as object,
      priority: options?.priority ?? 0,
      maxAttempts: options?.maxAttempts ?? JOB_CONFIG.defaultMaxAttempts,
      runAt: options?.runAt ?? new Date(),
    },
  });
  return job.id;
}

/**
 * Enqueue multiple jobs atomically in a single transaction.
 * Returns array of created job IDs.
 */
export async function enqueueBatch(
  jobs: Array<{
    type: JobType;
    payload: JobPayloadMap[JobType];
    options?: EnqueueOptions;
  }>
): Promise<string[]> {
  const created = await prisma.$transaction(
    jobs.map((j) =>
      prisma.jobQueue.create({
        data: {
          type: j.type,
          payload: j.payload as object,
          priority: j.options?.priority ?? 0,
          maxAttempts: j.options?.maxAttempts ?? JOB_CONFIG.defaultMaxAttempts,
          runAt: j.options?.runAt ?? new Date(),
        },
      })
    )
  );
  return created.map((j) => j.id);
}

/**
 * Claim the next available job using FOR UPDATE SKIP LOCKED.
 * Returns null if no jobs are available.
 */
export async function dequeue(types?: JobType[]): Promise<JobRow | null> {
  const typeFilter =
    types && types.length > 0
      ? `AND "type" IN (${types.map((t) => `'${t}'`).join(",")})`
      : "";

  const rows = await prisma.$queryRawUnsafe<JobRow[]>(`
    UPDATE "JobQueue"
    SET "status" = 'PROCESSING',
        "startedAt" = NOW(),
        "attempts" = "attempts" + 1,
        "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "id" FROM "JobQueue"
      WHERE "status" = 'PENDING'
        AND "runAt" <= NOW()
        ${typeFilter}
      ORDER BY "priority" DESC, "runAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Mark a job as completed.
 */
export async function complete(jobId: string): Promise<void> {
  await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

/**
 * Mark a job as failed. If attempts < maxAttempts, schedule retry with
 * exponential backoff. Otherwise mark as DEAD.
 */
export async function fail(
  jobId: string,
  error: string,
  attempts: number,
  maxAttempts: number
): Promise<void> {
  const truncatedError = error.substring(0, 2000);

  if (attempts >= maxAttempts) {
    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: "DEAD",
        lastError: truncatedError,
        completedAt: new Date(),
      },
    });
    return;
  }

  // Exponential backoff: 5s, 25s, 125s
  const backoffMs = Math.pow(5, attempts) * 1000;
  const runAt = new Date(Date.now() + backoffMs);

  await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: "PENDING",
      lastError: truncatedError,
      runAt,
    },
  });
}

/**
 * Get job status by ID (for API polling).
 */
export async function getJobStatus(jobId: string) {
  return prisma.jobQueue.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      type: true,
      status: true,
      lastError: true,
      attempts: true,
      maxAttempts: true,
      createdAt: true,
      completedAt: true,
    },
  });
}

/**
 * Reset stale PROCESSING jobs back to PENDING (crash recovery).
 */
export async function recoverStaleJobs(): Promise<number> {
  const threshold = new Date(
    Date.now() - JOB_CONFIG.staleThresholdMinutes * 60 * 1000
  );

  const result = await prisma.jobQueue.updateMany({
    where: {
      status: "PROCESSING",
      startedAt: { lt: threshold },
    },
    data: {
      status: "PENDING",
      lastError: "Recovered from stale PROCESSING state (worker restart)",
    },
  });

  return result.count;
}

/**
 * Delete completed/dead jobs older than retentionDays.
 */
export async function pruneOldJobs(
  retentionDays: number = JOB_CONFIG.retentionDays
): Promise<number> {
  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000
  );

  const result = await prisma.jobQueue.deleteMany({
    where: {
      status: { in: ["COMPLETED", "DEAD"] },
      createdAt: { lt: cutoff },
    },
  });

  return result.count;
}

/**
 * Check if a pending/processing job of the given type already exists.
 * Used by the cron scheduler to avoid duplicate scheduled jobs.
 */
export async function hasPendingJob(type: string): Promise<boolean> {
  const existing = await prisma.jobQueue.findFirst({
    where: {
      type,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    select: { id: true },
  });
  return existing !== null;
}
