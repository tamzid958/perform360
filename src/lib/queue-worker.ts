import { dequeue, complete, fail, recoverStaleJobs } from "./queue";
import { JOB_CONFIG } from "./constants";
import type { JobHandler, JobRow } from "@/types/job";

interface WorkerOptions {
  pollIntervalMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toISOString();
}

export function createWorker(
  handlers: Map<string, JobHandler<never>>,
  options?: WorkerOptions
) {
  const pollInterval = options?.pollIntervalMs ?? JOB_CONFIG.pollIntervalMs;
  let running = false;
  let processing = false;

  async function processJob(job: JobRow): Promise<void> {
    const handler = handlers.get(job.type);

    if (!handler) {
      await fail(job.id, `Unknown job type: ${job.type}`, job.attempts, job.maxAttempts);
      console.error(`[Worker] ${timestamp()} Unknown job type: ${job.type} (${job.id})`);
      return;
    }

    const start = Date.now();
    console.log(`[Worker] ${timestamp()} Processing ${job.type} (${job.id}), attempt ${job.attempts}/${job.maxAttempts}`);

    try {
      await handler(job.payload as never, job.id);
      await complete(job.id);
      const duration = Date.now() - start;
      console.log(`[Worker] ${timestamp()} Completed ${job.id} (${duration}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await fail(job.id, message, job.attempts, job.maxAttempts);
      const status = job.attempts >= job.maxAttempts ? "DEAD" : "retrying";
      console.error(`[Worker] ${timestamp()} Failed ${job.id}: ${message} (${status})`);
    }
  }

  async function poll(): Promise<void> {
    while (running) {
      try {
        const job = await dequeue();

        if (!job) {
          await sleep(pollInterval);
          continue;
        }

        processing = true;
        await processJob(job);
        processing = false;
      } catch (error) {
        processing = false;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Worker] ${timestamp()} Poll error: ${message}`);
        await sleep(pollInterval);
      }
    }
  }

  return {
    async start(): Promise<void> {
      running = true;
      console.log(`[Worker] ${timestamp()} Starting (poll interval: ${pollInterval}ms)`);

      const recovered = await recoverStaleJobs();
      if (recovered > 0) {
        console.log(`[Worker] ${timestamp()} Recovered ${recovered} stale jobs`);
      }

      await poll();
      console.log(`[Worker] ${timestamp()} Stopped gracefully`);
    },

    async stop(): Promise<void> {
      console.log(`[Worker] ${timestamp()} Shutting down...`);
      running = false;

      // Wait for current job to finish (max 60s)
      const deadline = Date.now() + 60_000;
      while (processing && Date.now() < deadline) {
        await sleep(500);
      }

      if (processing) {
        console.warn(`[Worker] ${timestamp()} Forced shutdown — job still processing`);
      }
    },
  };
}
