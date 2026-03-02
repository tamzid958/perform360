import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { setSelectedCompany } from "@/lib/company-cookie";
import { createMockRequest, parseResponse } from "../helpers";

const { POST } = await import("@/app/api/auth/select-company/route");

const validCompanyId = "ccompany1aaaabbbbccccdddd";

describe("POST /api/auth/select-company", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: validCompanyId },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });

  it("returns 400 for missing companyId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: {},
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("returns 400 for empty companyId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: "" },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("returns 403 when user does not belong to the company", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: validCompanyId },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("sets cookie and returns success for valid user + company", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "cuser1aaaabbbbccccddddeeee",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: validCompanyId },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(setSelectedCompany).toHaveBeenCalledWith(validCompanyId);
  });

  it("validates ownership with archivedAt: null filter", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: validCompanyId },
    });
    await POST(req as any);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          archivedAt: null,
          companyId: validCompanyId,
          role: { in: ["ADMIN", "HR"] },
        }),
      })
    );
  });

  it("rejects EMPLOYEE role users from selecting company", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "member@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    // findFirst returns null because the query filters role: { in: ["ADMIN", "HR"] }
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: validCompanyId },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("rejects EXTERNAL role users from selecting company", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "external@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    // findFirst returns null because the query filters role: { in: ["ADMIN", "HR"] }
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const req = createMockRequest("http://localhost:3000/api/auth/select-company", {
      method: "POST",
      body: { companyId: validCompanyId },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });
});
