import { createWorker } from "../src/lib/queue-worker";
import { jobHandlers } from "../src/lib/jobs";
import { enqueue, hasPendingJob } from "../src/lib/queue";
import { prisma } from "../src/lib/prisma";
import { JOB_CONFIG } from "../src/lib/constants";
import { JOB_TYPES } from "../src/types/job";

async function scheduleCronJobs(): Promise<void> {
  // Enqueue cycle.auto-close if not already pending
  if (!(await hasPendingJob(JOB_TYPES.CYCLE_AUTO_CLOSE))) {
    await enqueue(JOB_TYPES.CYCLE_AUTO_CLOSE, {});
  }

  // Enqueue cleanup.otp-sessions if not already pending
  if (!(await hasPendingJob(JOB_TYPES.CLEANUP_OTP_SESSIONS))) {
    await enqueue(JOB_TYPES.CLEANUP_OTP_SESSIONS, {});
  }
}

async function main(): Promise<void> {
  console.log("[Worker] Starting Perform360 job queue worker...");

  const worker = createWorker(jobHandlers, {
    pollIntervalMs: JOB_CONFIG.pollIntervalMs,
  });

  // Cron scheduler
  await scheduleCronJobs();
  const schedulerTimer = setInterval(
    scheduleCronJobs,
    JOB_CONFIG.schedulerIntervalMs
  );

  // Graceful shutdown
  const shutdown = async () => {
    clearInterval(schedulerTimer);
    await worker.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  await worker.start();
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
