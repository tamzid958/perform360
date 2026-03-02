import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { prisma, setupTestDatabase, cleanDatabase, factories } from "./setup";

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Contract: AuditLog", () => {
  it("creates an audit log entry", async () => {
    const company = await factories.company();
    const user = await factories.user(company.id);

    const log = await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        action: "user_login",
        target: `user:${user.id}`,
        metadata: { ip: "127.0.0.1" },
        ip: "127.0.0.1",
      },
    });

    expect(log.action).toBe("user_login");
    expect(log.metadata).toEqual({ ip: "127.0.0.1" });
  });

  it("allows null userId for system events", async () => {
    const company = await factories.company();

    const log = await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: null,
        action: "system_maintenance",
      },
    });

    expect(log.userId).toBeNull();
  });

  it("allows null optional fields", async () => {
    const company = await factories.company();

    const log = await prisma.auditLog.create({
      data: {
        companyId: company.id,
        action: "test_action",
      },
    });

    expect(log.target).toBeNull();
    expect(log.metadata).toBeNull();
    expect(log.ip).toBeNull();
  });
});

describe("Contract: JobQueue", () => {
  it("creates a job with defaults", async () => {
    const job = await prisma.jobQueue.create({
      data: {
        type: "cycle.activate",
        payload: { cycleId: "abc123" },
      },
    });

    expect(job.status).toBe("PENDING");
    expect(job.priority).toBe(0);
    expect(job.attempts).toBe(0);
    expect(job.maxAttempts).toBe(3);
  });

  it("validates JobStatus enum values", async () => {
    for (const status of ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "DEAD"] as const) {
      const job = await prisma.jobQueue.create({
        data: {
          type: `test.${status.toLowerCase()}`,
          payload: {},
          status,
        },
      });
      expect(job.status).toBe(status);
    }
  });

  it("stores JSON payload correctly", async () => {
    const payload = {
      cycleId: "c1",
      assignmentIds: ["a1", "a2", "a3"],
      nested: { key: "value" },
    };

    const job = await prisma.jobQueue.create({
      data: { type: "batch.send", payload },
    });

    const retrieved = await prisma.jobQueue.findUnique({ where: { id: job.id } });
    expect(retrieved?.payload).toEqual(payload);
  });

  it("allows nullable timing fields", async () => {
    const job = await prisma.jobQueue.create({
      data: { type: "test.nullable", payload: {} },
    });

    expect(job.startedAt).toBeNull();
    expect(job.completedAt).toBeNull();
    expect(job.lastError).toBeNull();
  });
});
