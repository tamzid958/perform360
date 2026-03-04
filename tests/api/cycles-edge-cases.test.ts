import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

vi.mock("@/lib/assignments", () => ({
  createAssignmentsForCycle: vi.fn().mockResolvedValue({ count: 0, reviewerEmails: [] }),
}));

const { POST } = await import("@/app/api/cycles/route");
const { PATCH } = await import("@/app/api/cycles/[id]/route");

const validCuid = "clxyz1234567890abcdef";

describe("POST /api/cycles — weight validation edge cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when weights do not sum to 100%", async () => {
    mockAuth(fixtures.admin);

    const req = createMockRequest("http://localhost:3000/api/cycles", {
      method: "POST",
      body: {
        name: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        teamTemplates: [{
          teamId: "t1",
          templateId: "tpl1",
          weights: { manager: 30, peer: 30, directReport: 10, self: 10, external: 10 },
          // sums to 90, not 100
        }],
      },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when all weights are 0", async () => {
    mockAuth(fixtures.admin);

    const req = createMockRequest("http://localhost:3000/api/cycles", {
      method: "POST",
      body: {
        name: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        teamTemplates: [{
          teamId: "t1",
          templateId: "tpl1",
          weights: { manager: 0, peer: 0, directReport: 0, self: 0, external: 0 },
        }],
      },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("returns 400 when weight values are negative", async () => {
    mockAuth(fixtures.admin);

    const req = createMockRequest("http://localhost:3000/api/cycles", {
      method: "POST",
      body: {
        name: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        teamTemplates: [{
          teamId: "t1",
          templateId: "tpl1",
          weights: { manager: -10, peer: 50, directReport: 20, self: 20, external: 20 },
        }],
      },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("returns 400 when weight value exceeds 100", async () => {
    mockAuth(fixtures.admin);

    const req = createMockRequest("http://localhost:3000/api/cycles", {
      method: "POST",
      body: {
        name: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        teamTemplates: [{
          teamId: "t1",
          templateId: "tpl1",
          weights: { manager: 150, peer: -50, directReport: 0, self: 0, external: 0 },
        }],
      },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("accepts valid weights summing to exactly 100", async () => {
    mockAuth(fixtures.admin);

    vi.mocked(prisma.team.findMany).mockResolvedValue([{ id: "t1" }] as any);
    vi.mocked(prisma.evaluationTemplate.findMany).mockResolvedValue([{ id: "tpl1" }] as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          evaluationCycle: { create: vi.fn().mockResolvedValue({ id: "c1", name: "Q1" }) },
          cycleTeam: { create: vi.fn().mockResolvedValue({ id: "ct-1" }), createMany: vi.fn() },
          cycleTeamLevelTemplate: { createMany: vi.fn() },
        });
      }
      return {};
    });
    vi.mocked(prisma.evaluationCycle.findUniqueOrThrow).mockResolvedValue({
      id: "c1",
      name: "Q1",
      cycleTeams: [],
      _count: { assignments: 0 },
    } as any);

    const req = createMockRequest("http://localhost:3000/api/cycles", {
      method: "POST",
      body: {
        name: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        teamTemplates: [{
          teamId: "t1",
          templateId: "tpl1",
          weights: { manager: 40, peer: 30, directReport: 10, self: 10, external: 10 },
        }],
      },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(201);
  });

  it("returns 400 for duplicate teamIds", async () => {
    mockAuth(fixtures.admin);

    const req = createMockRequest("http://localhost:3000/api/cycles", {
      method: "POST",
      body: {
        name: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        teamTemplates: [
          { teamId: "t1", templateId: "tpl1" },
          { teamId: "t1", templateId: "tpl2" },
        ],
      },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toContain("Duplicate teams");
  });
});

describe("PATCH /api/cycles/[id] — weight/status edge cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when updating teamTemplates on ACTIVE cycle", async () => {
    mockAuth(fixtures.admin);

    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: validCuid,
      status: "ACTIVE",
      companyId: fixtures.admin.companyId,
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/cycles/${validCuid}`, {
      method: "PATCH",
      body: {
        teamTemplates: [{ teamId: "t1", templateId: "tpl1" }],
      },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: validCuid }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });

  it("allows weight update on DRAFT cycle", async () => {
    mockAuth(fixtures.admin);

    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: validCuid,
      status: "DRAFT",
      companyId: fixtures.admin.companyId,
    } as any);
    vi.mocked(prisma.team.findMany).mockResolvedValue([{ id: "t1" }] as any);
    vi.mocked(prisma.evaluationTemplate.findMany).mockResolvedValue([{ id: "tpl1" }] as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          evaluationCycle: { update: vi.fn().mockResolvedValue({ id: validCuid }) },
          evaluationAssignment: { deleteMany: vi.fn() },
          cycleTeam: { deleteMany: vi.fn(), createMany: vi.fn() },
        });
      }
      return {};
    });
    vi.mocked(prisma.evaluationCycle.findUniqueOrThrow).mockResolvedValue({
      id: validCuid,
      status: "DRAFT",
      cycleTeams: [],
      _count: { assignments: 0 },
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/cycles/${validCuid}`, {
      method: "PATCH",
      body: {
        teamTemplates: [{
          teamId: "t1",
          templateId: "tpl1",
          weights: { manager: 40, peer: 30, directReport: 10, self: 10, external: 10 },
        }],
      },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: validCuid }) });
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("returns 400 for invalid status transition DRAFT -> CLOSED", async () => {
    mockAuth(fixtures.admin);

    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: validCuid,
      status: "DRAFT",
      companyId: fixtures.admin.companyId,
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/cycles/${validCuid}`, {
      method: "PATCH",
      body: { status: "CLOSED" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: validCuid }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });

  it("returns 400 for invalid status transition ARCHIVED -> ACTIVE", async () => {
    mockAuth(fixtures.admin);

    vi.mocked(prisma.evaluationCycle.findFirst).mockResolvedValue({
      id: validCuid,
      status: "ARCHIVED",
      companyId: fixtures.admin.companyId,
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/cycles/${validCuid}`, {
      method: "PATCH",
      body: { status: "ACTIVE" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: validCuid }) });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });
});
