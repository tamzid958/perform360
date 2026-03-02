import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createMockRequest, parseResponse } from "../helpers";

const { GET } = await import("@/app/api/auth/companies/route");

describe("GET /api/auth/companies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = createMockRequest("http://localhost:3000/api/auth/companies");
    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 401 when session has no email", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as any);

    const res = await GET();
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });

  it("returns companies for multi-company user", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        companyId: "ccompany1aaaabbbbccccdddd",
        role: "ADMIN",
        company: { id: "ccompany1aaaabbbbccccdddd", name: "Acme Corp", slug: "acme", logo: null },
      },
      {
        companyId: "ccompany2aaaabbbbccccdddd",
        role: "HR",
        company: { id: "ccompany2aaaabbbbccccdddd", name: "Beta Inc", slug: "beta", logo: "https://logo.png" },
      },
    ] as any);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toEqual({
      companyId: "ccompany1aaaabbbbccccdddd",
      companyName: "Acme Corp",
      companySlug: "acme",
      companyLogo: null,
      role: "ADMIN",
    });
  });

  it("filters out archived users", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    await GET();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          archivedAt: null,
        }),
      })
    );
  });

  it("filters to only ADMIN and HR roles", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "admin@test.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    await GET();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: { in: ["ADMIN", "HR"] },
        }),
      })
    );
  });
});
