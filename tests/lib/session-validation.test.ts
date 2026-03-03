import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Unmock so we test the real implementation
vi.unmock("@/lib/session-validation");
const { validateEvaluationSession } = await import("@/lib/session-validation");

const ASSIGNMENT_TOKEN = "assign-tok-abc";
const SESSION_TOKEN = "session-tok-123";

const baseAssignment = {
  id: "a1",
  token: ASSIGNMENT_TOKEN,
  status: "PENDING",
  reviewerId: "r1",
  subjectId: "s1",
  cycleId: "c1",
  templateId: "t1",
  cycle: { status: "ACTIVE", companyId: "co-1" },
};

describe("validateEvaluationSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns SESSION_EXPIRED when no session found", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue(null);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.code).toBe("SESSION_EXPIRED");
    }
  });

  it("returns SESSION_EXPIRED when session has no expiry", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: null,
      assignmentId: "a1",
      assignment: baseAssignment,
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("SESSION_EXPIRED");
    }
  });

  it("returns SESSION_EXPIRED when session is expired", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() - 60_000), // expired
      assignmentId: "a1",
      assignment: baseAssignment,
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("SESSION_EXPIRED");
    }
  });

  // ─── Direct session tests ───

  it("returns success for valid direct session with matching token", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: "a1",
      assignment: baseAssignment,
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.type).toBe("direct");
      expect(result.session.assignment.token).toBe(ASSIGNMENT_TOKEN);
    }
  });

  it("returns success for direct session with different token but same reviewer email", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: "a1",
      assignment: { ...baseAssignment, token: "other-token" },
      email: "reviewer@test.com",
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue({
      ...baseAssignment,
      reviewerId: "r1",
    } as any);

    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      email: "reviewer@test.com",
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.type).toBe("direct");
      expect(result.session.assignment.token).toBe(ASSIGNMENT_TOKEN);
    }
  });

  it("returns SESSION_MISMATCH for direct session with different token and different reviewer", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: "a1",
      assignment: { ...baseAssignment, token: "other-token" },
      email: "reviewer@test.com",
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue({
      ...baseAssignment,
      reviewerId: "r2",
    } as any);

    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      email: "different-reviewer@test.com",
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.code).toBe("SESSION_MISMATCH");
    }
  });

  it("returns INVALID_TOKEN for direct session with different token when assignment not found", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: "a1",
      assignment: { ...baseAssignment, token: "other-token" },
      email: "reviewer@test.com",
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue(null);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.code).toBe("INVALID_TOKEN");
    }
  });

  // ─── Summary session tests ───

  it("returns success for valid summary session with matching cycle and reviewer", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: null,
      assignment: null,
      reviewerLinkId: "rl-1",
      reviewerLink: { id: "rl-1", cycleId: "c1", reviewerId: "r1", token: "summary-tok" },
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue({
      ...baseAssignment,
      cycleId: "c1",
      reviewerId: "r1",
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.type).toBe("summary");
      expect(result.session.assignment.token).toBe(ASSIGNMENT_TOKEN);
    }
  });

  it("returns INVALID_TOKEN for summary session when assignment not found", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: null,
      assignment: null,
      reviewerLinkId: "rl-1",
      reviewerLink: { id: "rl-1", cycleId: "c1", reviewerId: "r1", token: "summary-tok" },
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue(null);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.code).toBe("INVALID_TOKEN");
    }
  });

  it("returns SESSION_MISMATCH for summary session with wrong cycleId", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: null,
      assignment: null,
      reviewerLinkId: "rl-1",
      reviewerLink: { id: "rl-1", cycleId: "c1", reviewerId: "r1", token: "summary-tok" },
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue({
      ...baseAssignment,
      cycleId: "different-cycle", // mismatch
      reviewerId: "r1",
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.code).toBe("SESSION_MISMATCH");
    }
  });

  it("returns SESSION_MISMATCH for summary session with wrong reviewerId", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: null,
      assignment: null,
      reviewerLinkId: "rl-1",
      reviewerLink: { id: "rl-1", cycleId: "c1", reviewerId: "r1", token: "summary-tok" },
    } as any);

    vi.mocked(prisma.evaluationAssignment.findUnique).mockResolvedValue({
      ...baseAssignment,
      cycleId: "c1",
      reviewerId: "different-reviewer", // mismatch
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.code).toBe("SESSION_MISMATCH");
    }
  });

  it("returns INVALID_SESSION when session has neither assignmentId nor reviewerLinkId", async () => {
    vi.mocked(prisma.otpSession.findUnique).mockResolvedValue({
      sessionToken: SESSION_TOKEN,
      sessionExpiry: new Date(Date.now() + 3600_000),
      assignmentId: null,
      assignment: null,
      reviewerLinkId: null,
      reviewerLink: null,
    } as any);

    const result = await validateEvaluationSession(SESSION_TOKEN, ASSIGNMENT_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.code).toBe("INVALID_SESSION");
    }
  });
});
