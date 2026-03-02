import { vi } from "vitest";

// Mock Prisma client globally
vi.mock("@/lib/prisma", () => {
  const prisma = {
    user: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    team: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    teamMember: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    evaluationCycle: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    evaluationAssignment: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), createMany: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    evaluationTemplate: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    evaluationResponse: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    cycleTeam: { createMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    superAdmin: { findUnique: vi.fn() },
    auditLog: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    jobQueue: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    otpSession: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    company: { findUnique: vi.fn(), update: vi.fn() },
    recoveryCode: { findMany: vi.fn(), create: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
    authUser: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn((cb: unknown) =>
      typeof cb === "function" ? cb({}) : Promise.all(cb as Promise<unknown>[])
    ),
    $queryRawUnsafe: vi.fn(),
  };
  return { prisma, default: prisma };
});

// Mock NextAuth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock impersonation
vi.mock("@/lib/impersonation", () => ({
  getImpersonation: vi.fn().mockResolvedValue(null),
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  getOTPEmail: vi.fn().mockReturnValue({ html: "<p>OTP</p>", text: "OTP" }),
  getUserInviteEmail: vi.fn().mockReturnValue({ html: "<p>Invite</p>", text: "Invite" }),
}));

// Mock encryption session
vi.mock("@/lib/encryption-session", () => ({
  getDataKeyFromRequest: vi.fn().mockReturnValue(null),
  encryptDataKeyForCookie: vi.fn().mockReturnValue("encrypted-cookie-value"),
  decryptDataKeyFromCookie: vi.fn().mockReturnValue(null),
  COOKIE_NAME: "_enc_dk",
  COOKIE_MAX_AGE: 14400,
}));

// Mock recaptcha
vi.mock("@/lib/recaptcha", () => ({
  requireRecaptcha: vi.fn().mockResolvedValue(null),
}));

// Mock queue
vi.mock("@/lib/queue", () => ({
  enqueue: vi.fn().mockResolvedValue("job-123"),
  enqueueBatch: vi.fn().mockResolvedValue(["job-1", "job-2"]),
}));

// Mock audit
vi.mock("@/lib/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));
