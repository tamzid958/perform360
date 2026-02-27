import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET } = await import("@/app/api/audit-log/route");

describe("GET /api/audit-log", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createMockRequest("http://localhost:3000/api/audit-log");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-ADMIN", async () => {
    mockAuth(fixtures.hr);
    const req = createMockRequest("http://localhost:3000/api/audit-log");
    const res = await GET(req as any);
    expect(res.status).toBe(403);
  });

  it("returns paginated audit logs", async () => {
    mockAuth(fixtures.admin);
    const logs = [
      { id: "log1", action: "user_invite", createdAt: new Date() },
      { id: "log2", action: "role_change", createdAt: new Date() },
    ];
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(logs as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(2);

    const req = createMockRequest("http://localhost:3000/api/audit-log?page=1&limit=50");
    const res = await GET(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.logs).toHaveLength(2);
    expect(body.data.pagination.total).toBe(2);
    expect(body.data.pagination.totalPages).toBe(1);
  });

  it("filters by action", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

    const req = createMockRequest("http://localhost:3000/api/audit-log?action=role_change");
    const res = await GET(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: "role_change" }),
      })
    );
  });

  it("clamps pagination params", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

    const req = createMockRequest("http://localhost:3000/api/audit-log?page=-5&limit=9999");
    const res = await GET(req as any);
    const { body } = await parseResponse(res);

    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(100);
  });
});
