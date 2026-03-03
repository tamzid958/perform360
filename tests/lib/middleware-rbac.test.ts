import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Override the global setup.ts mocks for api-auth and rate-limit
vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
  requireSuperAdmin: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit: vi.fn().mockReturnValue(null),
}));

const { requireAuth, requireSuperAdmin } = await import("@/lib/api-auth");
const { applyRateLimit } = await import("@/lib/rate-limit");
const { withRBAC, withAdminOrHR, withAdmin } = await import("@/lib/middleware/rbac");
const { withSuperAdmin } = await import("@/lib/middleware/super-admin");

function makeRequest(url = "http://localhost:3000/api/test") {
  return new NextRequest(url);
}

describe("withRBAC", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows request when user has required role", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1",
      email: "admin@test.com",
      role: "ADMIN",
      companyId: "co-1",
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRBAC(handler, { requiredRoles: ["ADMIN", "HR"] });

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        auth: expect.objectContaining({ role: "ADMIN" }),
      })
    );
  });

  it("returns 403 when user role is not allowed", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1",
      email: "emp@test.com",
      role: "EMPLOYEE",
      companyId: "co-1",
    });

    const handler = vi.fn();
    const wrapped = withRBAC(handler, { requiredRoles: ["ADMIN"] });

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when user is unauthenticated", async () => {
    const unauth = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue(unauth as any);

    const handler = vi.fn();
    const wrapped = withRBAC(handler, { requiredRoles: ["ADMIN"] });

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes resolved params to handler", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1",
      email: "a@t.com",
      role: "ADMIN",
      companyId: "co-1",
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({}));
    const wrapped = withRBAC(handler, { requiredRoles: ["ADMIN"] });

    await wrapped(makeRequest(), { params: Promise.resolve({ id: "123" }) });
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ params: { id: "123" } })
    );
  });
});

describe("withAdminOrHR", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows ADMIN role", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1", email: "a@t.com", role: "ADMIN", companyId: "co-1",
    });
    const handler = vi.fn().mockResolvedValue(NextResponse.json({}));
    const wrapped = withAdminOrHR(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
  });

  it("allows HR role", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1", email: "hr@t.com", role: "HR", companyId: "co-1",
    });
    const handler = vi.fn().mockResolvedValue(NextResponse.json({}));
    const wrapped = withAdminOrHR(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
  });

  it("rejects EMPLOYEE role", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1", email: "e@t.com", role: "EMPLOYEE", companyId: "co-1",
    });
    const handler = vi.fn();
    const wrapped = withAdminOrHR(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });
});

describe("withAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects HR role", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "u1", email: "hr@t.com", role: "HR", companyId: "co-1",
    });
    const handler = vi.fn();
    const wrapped = withAdmin(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });
});

describe("withSuperAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows super admin", async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({
      id: "sa-1",
      email: "super@admin.com",
    });
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withSuperAdmin(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        auth: { id: "sa-1", email: "super@admin.com" },
      })
    );
  });

  it("returns 403 for non-super-admin", async () => {
    const forbidden = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    vi.mocked(requireSuperAdmin).mockResolvedValue(forbidden as any);

    const handler = vi.fn();
    const wrapped = withSuperAdmin(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("applies rate limiting", async () => {
    const rateLimitRes = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
    vi.mocked(applyRateLimit).mockReturnValueOnce(rateLimitRes);

    const handler = vi.fn();
    const wrapped = withSuperAdmin(handler);

    const res = await wrapped(makeRequest(), { params: Promise.resolve({}) });
    expect(res.status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
  });
});
