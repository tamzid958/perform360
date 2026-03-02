import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET: getStats } = await import("@/app/api/dashboard/stats/route");
const { GET: getActivity } = await import("@/app/api/dashboard/activity/route");

describe("GET /api/dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(fixtures.admin);
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createMockRequest("http://localhost:3000/api/dashboard/stats");
    const res = await getStats(req as any);
    expect(res.status).toBe(401);
  });

  it("returns dashboard stats", async () => {
    vi.mocked(prisma.evaluationCycle.count).mockResolvedValue(2);
    vi.mocked(prisma.team.count).mockResolvedValue(5);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([
      { status: "SUBMITTED" },
      { status: "PENDING" },
      { status: "SUBMITTED" },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/dashboard/stats");
    const res = await getStats(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.activeCycles).toBe(2);
    expect(body.data.totalTeams).toBe(5);
    expect(body.data.pendingReviews).toBe(1);
    expect(body.data.completionRate).toBe(67);
  });

  it("returns 0 completion rate with no assignments", async () => {
    vi.mocked(prisma.evaluationCycle.count).mockResolvedValue(0);
    vi.mocked(prisma.team.count).mockResolvedValue(0);
    vi.mocked(prisma.evaluationAssignment.findMany).mockResolvedValue([]);

    const req = createMockRequest("http://localhost:3000/api/dashboard/stats");
    const res = await getStats(req as any);
    const { body } = await parseResponse(res);

    expect(body.data.completionRate).toBe(0);
  });
});

describe("GET /api/dashboard/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(fixtures.admin);
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createMockRequest("http://localhost:3000/api/dashboard/activity");
    const res = await getActivity(req as any);
    expect(res.status).toBe(401);
  });

  it("returns activity feed sorted by timestamp", async () => {
    const now = new Date();
    vi.mocked(prisma.evaluationResponse.findMany).mockResolvedValue([]);
    vi.mocked(prisma.evaluationCycle.findMany).mockResolvedValue([
      {
        id: "c1",
        name: "Q1 2026",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: new Date(now.getTime() + 1000),
      },
    ] as any);
    vi.mocked(prisma.team.findMany).mockResolvedValue([
      { id: "t1", name: "Engineering", createdAt: now, _count: { members: 3 } },
    ] as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", name: "Alice", role: "ADMIN", createdAt: now },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/dashboard/activity");
    const res = await getActivity(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });
});
