import { createWorker } from "../src/lib/queue-worker";
import { jobHandlers } from "../src/lib/jobs";
import { enqueue, hasPendingJob } from "../src/lib/queue";
import { prisma } from "../src/lib/prisma";
import { JOB_CONFIG, BLOG_CONFIG } from "../src/lib/constants";
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

  // Enqueue blog.generate once per day (if blog settings are configured)
  // Check DB for today's blog posts instead of in-memory state (survives worker restarts)
  if (!(await hasPendingJob(JOB_TYPES.BLOG_GENERATE))) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayPostCount = await prisma.blogPost.count({
        where: { createdAt: { gte: todayStart } },
      });

      if (todayPostCount === 0) {
        const settings = await prisma.blogSettings.findUnique({
          where: { id: "singleton" },
        });
        if (settings?.ollamaApiUrl && !settings.generationPaused) {
          await enqueue(
            JOB_TYPES.BLOG_GENERATE,
            { count: BLOG_CONFIG.dailyArticleCount },
            { maxAttempts: 1 }
          );
          console.log("[Worker] Scheduled daily blog generation");
        }
      }
    } catch {
      // Blog settings not configured yet — skip
    }
  }
}

async function main(): Promise<void> {
  console.log("[Worker] Starting Performs360 job queue worker...");

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
