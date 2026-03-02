import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET, PATCH, DELETE } = await import("@/app/api/teams/[id]/route");

const validCuid = "clx1abc2def3ghi4jkl5mno6p";

function callWithParams(handler: Function, req: any, id: string) {
  return handler(req, { params: { id } });
}

describe("API /api/teams/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 400 for invalid id format", async () => {
      mockAuth(fixtures.admin);
      const req = createMockRequest("http://localhost:3000/api/teams/invalid-id");
      const res = await callWithParams(GET, req, "invalid-id");
      const { status, body } = await parseResponse(res);
      expect(status).toBe(400);
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when team not found", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue(null);
      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`);
      const res = await callWithParams(GET, req, validCuid);
      const { status, body } = await parseResponse(res);
      expect(status).toBe(404);
      expect(body.code).toBe("NOT_FOUND");
    });

    it("returns team with members", async () => {
      mockAuth(fixtures.admin);
      const mockTeam = {
        id: validCuid,
        name: "Engineering",
        companyId: fixtures.admin.companyId,
        members: [{ userId: "u1", user: { id: "u1", name: "Alice", email: "alice@test.com" } }],
      };
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeam as any);

      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`);
      const res = await callWithParams(GET, req, validCuid);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe("Engineering");
    });
  });

  describe("PATCH", () => {
    it("returns 403 for MEMBER role", async () => {
      mockAuth(fixtures.member);
      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, {
        method: "PATCH",
        body: { name: "Updated" },
      });
      const res = await callWithParams(PATCH, req, validCuid);
      const { status } = await parseResponse(res);
      expect(status).toBe(403);
    });

    it("returns 404 when team not found", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue(null);
      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, {
        method: "PATCH",
        body: { name: "Updated" },
      });
      const res = await callWithParams(PATCH, req, validCuid);
      const { status } = await parseResponse(res);
      expect(status).toBe(404);
    });

    it("updates team name", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue({ id: validCuid, companyId: fixtures.admin.companyId } as any);
      vi.mocked(prisma.team.update).mockResolvedValue({ id: validCuid, name: "Updated" } as any);

      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, {
        method: "PATCH",
        body: { name: "Updated" },
      });
      const res = await callWithParams(PATCH, req, validCuid);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("archives team when archived=true", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue({ id: validCuid, companyId: fixtures.admin.companyId } as any);
      vi.mocked(prisma.team.update).mockResolvedValue({ id: validCuid } as any);

      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, {
        method: "PATCH",
        body: { archived: true },
      });
      const res = await callWithParams(PATCH, req, validCuid);
      const { status } = await parseResponse(res);
      expect(status).toBe(200);

      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            archivedAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("DELETE", () => {
    it("returns 404 when team not found", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue(null);
      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, { method: "DELETE" });
      const res = await callWithParams(DELETE, req, validCuid);
      const { status } = await parseResponse(res);
      expect(status).toBe(404);
    });

    it("returns 409 when team is linked to cycles", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue({ id: validCuid, companyId: fixtures.admin.companyId } as any);
      vi.mocked(prisma.cycleTeam.count).mockResolvedValue(2);

      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, { method: "DELETE" });
      const res = await callWithParams(DELETE, req, validCuid);
      const { status, body } = await parseResponse(res);
      expect(status).toBe(409);
      expect(body.code).toBe("TEAM_IN_USE");
    });

    it("deletes team and members when not linked to cycles", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findFirst).mockResolvedValue({ id: validCuid, companyId: fixtures.admin.companyId } as any);
      vi.mocked(prisma.cycleTeam.count).mockResolvedValue(0);
      vi.mocked(prisma.$transaction).mockResolvedValue([]);

      const req = createMockRequest(`http://localhost:3000/api/teams/${validCuid}`, { method: "DELETE" });
      const res = await callWithParams(DELETE, req, validCuid);
      const { status, body } = await parseResponse(res);
      expect(status).toBe(200);
      expect(body.data.deleted).toBe(true);
    });
  });
});
