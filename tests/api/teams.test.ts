import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

// Must import after mocks are set up
const { GET, POST } = await import("@/app/api/teams/route");

describe("API /api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/teams", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = createMockRequest("http://localhost:3000/api/teams");
      const res = await GET(req as any);
      const { status, body } = await parseResponse(res);
      expect(status).toBe(401);
      expect(body.success).toBe(false);
    });

    it("returns paginated teams for authenticated user", async () => {
      mockAuth(fixtures.admin);
      const mockTeams = [
        { id: "team-1", name: "Engineering", companyId: "ccompany-1", members: [], _count: { members: 2 } },
      ];
      vi.mocked(prisma.team.findMany).mockResolvedValue(mockTeams as any);
      vi.mocked(prisma.team.count).mockResolvedValue(1);

      const req = createMockRequest("http://localhost:3000/api/teams");
      const res = await GET(req as any);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      });
    });

    it("passes search parameter to query", async () => {
      mockAuth(fixtures.admin);
      vi.mocked(prisma.team.findMany).mockResolvedValue([]);
      vi.mocked(prisma.team.count).mockResolvedValue(0);

      const req = createMockRequest("http://localhost:3000/api/teams?search=eng");
      const res = await GET(req as any);
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: fixtures.admin.companyId,
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: "eng", mode: "insensitive" } }),
            ]),
          }),
        })
      );
    });
  });

  describe("POST /api/teams", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = createMockRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: { name: "New Team" },
      });
      const res = await POST(req as any);
      const { status } = await parseResponse(res);
      expect(status).toBe(401);
    });

    it("returns 403 when MEMBER tries to create team", async () => {
      mockAuth(fixtures.member);
      const req = createMockRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: { name: "New Team" },
      });
      const res = await POST(req as any);
      const { status, body } = await parseResponse(res);
      expect(status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("creates team for ADMIN", async () => {
      mockAuth(fixtures.admin);
      const mockTeam = {
        id: "team-new",
        name: "New Team",
        companyId: "ccompany-1",
        _count: { members: 0 },
      };
      vi.mocked(prisma.team.create).mockResolvedValue(mockTeam as any);

      const req = createMockRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: { name: "New Team", description: "A new team" },
      });
      const res = await POST(req as any);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "New Team",
            description: "A new team",
            companyId: fixtures.admin.companyId,
          }),
        })
      );
    });

    it("creates team for HR", async () => {
      mockAuth(fixtures.hr);
      vi.mocked(prisma.team.create).mockResolvedValue({ id: "team-new" } as any);

      const req = createMockRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: { name: "HR Team" },
      });
      const res = await POST(req as any);
      const { status } = await parseResponse(res);
      expect(status).toBe(201);
    });

    it("returns 400 for invalid body", async () => {
      mockAuth(fixtures.admin);
      const req = createMockRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: { name: "" },
      });
      const res = await POST(req as any);
      const { status, body } = await parseResponse(res);
      expect(status).toBe(400);
      expect(body.code).toBe("VALIDATION_ERROR");
    });
  });
});
