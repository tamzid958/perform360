import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET, PATCH, DELETE } = await import("@/app/api/users/[id]/route");

const validCuid = "clx1abc2def3ghi4jkl5mno6p";
const callWith = (handler: Function, req: any, id: string) =>
  handler(req, { params: { id } });

describe("GET /api/users/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`);
    const res = await callWith(GET, req, validCuid);
    expect(res.status).toBe(401);
  });

  it("returns user with evaluations and stats", async () => {
    mockAuth(fixtures.admin);
    // First findFirst = auth, second = user lookup
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: "ADMIN", companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({
        id: validCuid,
        name: "Target User",
        email: "target@test.com",
        avatar: null,
        role: "MEMBER",
        createdAt: new Date(),
        teamMemberships: [{ id: "tm1", role: "MEMBER", team: { id: "t1", name: "Eng" } }],
      } as any);
    vi.mocked(prisma.evaluationAssignment.findMany)
      .mockResolvedValueOnce([]) // asSubject
      .mockResolvedValueOnce([]); // asReviewer

    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`);
    const res = await callWith(GET, req, validCuid);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.name).toBe("Target User");
    expect(body.data.stats.totalTeams).toBe(1);
  });

  it("returns 404 for user not in company", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: "ADMIN", companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce(null);

    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`);
    const res = await callWith(GET, req, validCuid);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/users/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates user role and writes audit log", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: "ADMIN", companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({ id: validCuid, role: "MEMBER", companyId: fixtures.admin.companyId } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: validCuid, role: "HR" } as any);

    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`, {
      method: "PATCH",
      body: { role: "HR" },
    });
    const res = await callWith(PATCH, req, validCuid);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "role_change" })
    );
  });

  it("prevents HR from assigning ADMIN role", async () => {
    mockAuth(fixtures.hr);
    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`, {
      method: "PATCH",
      body: { role: "ADMIN" },
    });
    const res = await callWith(PATCH, req, validCuid);
    expect(res.status).toBe(403);
  });

  it("prevents ADMIN from demoting themselves", async () => {
    // Use validCuid as admin userId to pass CUID param validation
    const adminId = validCuid;
    mockAuth({ ...fixtures.admin, userId: adminId });
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: adminId, email: fixtures.admin.email, role: "ADMIN", companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({ id: adminId, role: "ADMIN", companyId: fixtures.admin.companyId } as any);

    const req = createMockRequest(`http://localhost:3000/api/users/${adminId}`, {
      method: "PATCH",
      body: { role: "MEMBER" },
    });
    const res = await callWith(PATCH, req, adminId);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("prevents HR from modifying ADMIN users", async () => {
    mockAuth(fixtures.hr);
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.hr.userId, email: fixtures.hr.email, role: "HR", companyId: fixtures.hr.companyId } as any)
      .mockResolvedValueOnce({ id: validCuid, role: "ADMIN", companyId: fixtures.hr.companyId } as any);

    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`, {
      method: "PATCH",
      body: { name: "New Name" },
    });
    const res = await callWith(PATCH, req, validCuid);
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/users/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes user and cascades related records", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: "ADMIN", companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({ id: validCuid, role: "MEMBER", companyId: fixtures.admin.companyId } as any);

    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`, { method: "DELETE" });
    const res = await callWith(DELETE, req, validCuid);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it("prevents deleting yourself", async () => {
    // Use validCuid as admin userId to pass CUID param validation
    const adminId = validCuid;
    mockAuth({ ...fixtures.admin, userId: adminId });
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: adminId, email: fixtures.admin.email, role: "ADMIN", companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({ id: adminId, role: "ADMIN", companyId: fixtures.admin.companyId } as any);

    const req = createMockRequest(`http://localhost:3000/api/users/${adminId}`, { method: "DELETE" });
    const res = await callWith(DELETE, req, adminId);
    expect(res.status).toBe(403);
  });

  it("prevents HR from deleting ADMIN", async () => {
    mockAuth(fixtures.hr);
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.hr.userId, email: fixtures.hr.email, role: "HR", companyId: fixtures.hr.companyId } as any)
      .mockResolvedValueOnce({ id: validCuid, role: "ADMIN", companyId: fixtures.hr.companyId } as any);

    const req = createMockRequest(`http://localhost:3000/api/users/${validCuid}`, { method: "DELETE" });
    const res = await callWith(DELETE, req, validCuid);
    expect(res.status).toBe(403);
  });
});
