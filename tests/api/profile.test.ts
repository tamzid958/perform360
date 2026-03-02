import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET, PATCH } = await import("@/app/api/profile/route");

describe("GET /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createMockRequest("http://localhost:3000/api/profile");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns profile with company name and teams", async () => {
    mockAuth(fixtures.member);
    // Auth calls findFirst once, then the route calls findFirst for profile
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.member.userId, email: fixtures.member.email, role: "MEMBER", companyId: fixtures.member.companyId } as any)
      .mockResolvedValueOnce({
        id: fixtures.member.userId,
        name: "Test Member",
        email: fixtures.member.email,
        avatar: null,
        role: "MEMBER",
        company: { name: "Acme Corp" },
        teamMemberships: [
          { role: "MEMBER", team: { id: "t1", name: "Engineering" } },
        ],
      } as any);

    const req = createMockRequest("http://localhost:3000/api/profile");
    const res = await GET(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.name).toBe("Test Member");
    expect(body.data.companyName).toBe("Acme Corp");
    expect(body.data.teams).toHaveLength(1);
  });

  it("returns 404 when user record missing", async () => {
    mockAuth(fixtures.member);
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.member.userId, email: fixtures.member.email, role: "MEMBER", companyId: fixtures.member.companyId } as any)
      .mockResolvedValueOnce(null);

    const req = createMockRequest("http://localhost:3000/api/profile");
    const res = await GET(req as any);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates profile name and syncs AuthUser", async () => {
    mockAuth(fixtures.member);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: fixtures.member.userId,
      name: "New Name",
      email: fixtures.member.email,
      avatar: null,
      role: "MEMBER",
    } as any);
    vi.mocked(prisma.authUser.updateMany).mockResolvedValue({ count: 1 } as any);

    const req = createMockRequest("http://localhost:3000/api/profile", {
      method: "PATCH",
      body: { name: "New Name" },
    });
    const res = await PATCH(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.name).toBe("New Name");
    expect(prisma.authUser.updateMany).toHaveBeenCalled();
  });

  it("rejects invalid avatar URL", async () => {
    mockAuth(fixtures.member);
    const req = createMockRequest("http://localhost:3000/api/profile", {
      method: "PATCH",
      body: { avatar: "not-a-url" },
    });
    const res = await PATCH(req as any);
    expect(res.status).toBe(400);
  });
});
