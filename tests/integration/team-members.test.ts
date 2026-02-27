import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const teamsRoute = await import("@/app/api/teams/route");
const teamIdRoute = await import("@/app/api/teams/[id]/route");
const membersRoute = await import("@/app/api/teams/[id]/members/route");

const validCuid = "clx1abc2def3ghi4jkl5mno6p";
const userId = "clxuser1abc2def3ghi4jkl5m";

function callWithParams(handler: Function, req: any, params: Record<string, string>) {
  return handler(req, { params });
}

describe("Integration: Team + Members Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(fixtures.admin);
  });

  it("create team → add manager → add member → verify duplicate rejected", async () => {
    // 1. Create team
    const mockTeam = { id: validCuid, name: "Engineering", companyId: fixtures.admin.companyId, _count: { members: 0 } };
    vi.mocked(prisma.team.create).mockResolvedValue(mockTeam as any);

    const createReq = createMockRequest("http://localhost:3000/api/teams", {
      method: "POST",
      body: { name: "Engineering", description: "Core eng team" },
    });
    const createRes = await teamsRoute.POST(createReq as any);
    const { status: createStatus, body: createBody } = await parseResponse(createRes);
    expect(createStatus).toBe(201);
    expect(createBody.data.name).toBe("Engineering");

    // 2. Add manager
    vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeam as any);
    // First findFirst = auth check (returns admin), second = user lookup for the new member
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: fixtures.admin.role, companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({ id: userId, companyId: fixtures.admin.companyId } as any);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null); // no existing membership
    vi.mocked(prisma.teamMember.create).mockResolvedValue({
      userId,
      teamId: validCuid,
      role: "MANAGER",
      user: { id: userId, name: "Alice", email: "alice@test.com" },
    } as any);

    const addMgrReq = createMockRequest(`http://localhost:3000/api/teams/${validCuid}/members`, {
      method: "POST",
      body: { userId, role: "MANAGER" },
    });
    const addMgrRes = await callWithParams(membersRoute.POST, addMgrReq, { id: validCuid });
    const { status: mgrStatus } = await parseResponse(addMgrRes);
    expect(mgrStatus).toBe(201);

    // 3. Try to add same user again → 409 duplicate
    // Re-mock auth + user lookup for the second POST
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: fixtures.admin.role, companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce({ id: userId, companyId: fixtures.admin.companyId } as any);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ userId, teamId: validCuid } as any);

    const dupReq = createMockRequest(`http://localhost:3000/api/teams/${validCuid}/members`, {
      method: "POST",
      body: { userId, role: "MEMBER" },
    });
    const dupRes = await callWithParams(membersRoute.POST, dupReq, { id: validCuid });
    const { status: dupStatus, body: dupBody } = await parseResponse(dupRes);
    expect(dupStatus).toBe(409);
    expect(dupBody.code).toBe("DUPLICATE");
  });

  it("team linked to cycle → cannot delete, must archive", async () => {
    // Setup: team exists, linked to a cycle
    vi.mocked(prisma.team.findFirst).mockResolvedValue({
      id: validCuid,
      companyId: fixtures.admin.companyId,
    } as any);
    vi.mocked(prisma.cycleTeam.count).mockResolvedValue(1);

    // 1. Try delete → 409
    const deleteReq = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, { method: "DELETE" });
    const deleteRes = await callWithParams(teamIdRoute.DELETE, deleteReq, { id: validCuid });
    const { status: deleteStatus, body: deleteBody } = await parseResponse(deleteRes);
    expect(deleteStatus).toBe(409);
    expect(deleteBody.code).toBe("TEAM_IN_USE");

    // 2. Archive instead → 200
    vi.mocked(prisma.team.update).mockResolvedValue({ id: validCuid, archivedAt: new Date() } as any);

    const archiveReq = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, {
      method: "PATCH",
      body: { archived: true },
    });
    const archiveRes = await callWithParams(teamIdRoute.PATCH, archiveReq, { id: validCuid });
    const { status: archiveStatus } = await parseResponse(archiveRes);
    expect(archiveStatus).toBe(200);

    expect(prisma.team.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });

  it("add member → cross-company user rejected", async () => {
    vi.mocked(prisma.team.findFirst).mockResolvedValue({
      id: validCuid,
      companyId: fixtures.admin.companyId,
    } as any);
    // First findFirst call is for auth (returns admin), second is for cross-company user check (returns null)
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: fixtures.admin.userId, email: fixtures.admin.email, role: fixtures.admin.role, companyId: fixtures.admin.companyId } as any)
      .mockResolvedValueOnce(null);

    const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}/members`, {
      method: "POST",
      body: { userId: "other-company-user", role: "MEMBER" },
    });
    const res = await callWithParams(membersRoute.POST, req, { id: validCuid });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.error).toContain("User not found");
  });

  it("MEMBER role cannot manage team members", async () => {
    mockAuth(fixtures.employee);

    const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}/members`, {
      method: "POST",
      body: { userId, role: "MEMBER" },
    });
    const res = await callWithParams(membersRoute.POST, req, { id: validCuid });
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });
});
