import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseResponse } from "../helpers";

const { GET: validateSummaryToken } = await import(
  "@/app/api/review/[token]/route"
);

const SUMMARY_TOKEN = "summary-tok-xyz";

function makeRequest(url: string) {
  return new NextRequest(url, {
    method: "GET",
    headers: { "x-forwarded-for": "127.0.0.1" },
  });
}

describe("Review: Summary token validation (GET /api/review/[token])", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates a good summary token and returns masked email + counts", async () => {
    vi.mocked(prisma.cycleReviewerLink.findUnique).mockResolvedValue({
      id: "rl-1",
      token: SUMMARY_TOKEN,
      cycleId: "c1",
      reviewerId: "r1",
      cycle: {
        name: "Q1 2026",
        status: "ACTIVE",
        endDate: new Date(Date.now() + 7 * 86400000),
      },
    } as any);

    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      name: "John Doe",
      email: "john.doe@company.com",
    } as any);

    vi.mocked(prisma.evaluationAssignment.count)
      .mockResolvedValueOnce(3) // totalAssignments
      .mockResolvedValueOnce(2); // pendingAssignments

    const req = makeRequest(`http://localhost:3000/api/review/${SUMMARY_TOKEN}`);
    const res = await validateSummaryToken(req, { params: Promise.resolve({ token: SUMMARY_TOKEN }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe(SUMMARY_TOKEN);
    expect(body.data.cycleName).toBe("Q1 2026");
    expect(body.data.reviewerEmailMasked).toBe("jo******@company.com");
    expect(body.data.totalAssignments).toBe(3);
    expect(body.data.pendingAssignments).toBe(2);
  });

  it("returns 404 for invalid summary token", async () => {
    vi.mocked(prisma.cycleReviewerLink.findUnique).mockResolvedValue(null);

    const req = makeRequest("http://localhost:3000/api/review/bad-token");
    const res = await validateSummaryToken(req, { params: Promise.resolve({ token: "bad-token" }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.code).toBe("INVALID_TOKEN");
  });

  it("returns 410 for inactive cycle", async () => {
    vi.mocked(prisma.cycleReviewerLink.findUnique).mockResolvedValue({
      id: "rl-1",
      token: SUMMARY_TOKEN,
      cycleId: "c1",
      reviewerId: "r1",
      cycle: {
        name: "Q1 2026",
        status: "CLOSED",
        endDate: new Date(Date.now() + 86400000),
      },
    } as any);

    const req = makeRequest(`http://localhost:3000/api/review/${SUMMARY_TOKEN}`);
    const res = await validateSummaryToken(req, { params: Promise.resolve({ token: SUMMARY_TOKEN }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(410);
    expect(body.code).toBe("CYCLE_INACTIVE");
  });

  it("returns 410 for expired cycle", async () => {
    vi.mocked(prisma.cycleReviewerLink.findUnique).mockResolvedValue({
      id: "rl-1",
      token: SUMMARY_TOKEN,
      cycleId: "c1",
      reviewerId: "r1",
      cycle: {
        name: "Q1 2026",
        status: "ACTIVE",
        endDate: new Date(Date.now() - 86400000), // past
      },
    } as any);

    const req = makeRequest(`http://localhost:3000/api/review/${SUMMARY_TOKEN}`);
    const res = await validateSummaryToken(req, { params: Promise.resolve({ token: SUMMARY_TOKEN }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(410);
    expect(body.code).toBe("CYCLE_EXPIRED");
  });
});
