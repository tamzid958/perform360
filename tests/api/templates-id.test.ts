import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET, PATCH, DELETE } = await import("@/app/api/templates/[id]/route");

const validCuid = "clx1abc2def3ghi4jkl5mno6p";
const callWith = (handler: Function, req: any, id: string) =>
  handler(req, { params: { id } });

describe("GET /api/templates/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns template (including global)", async () => {
    mockAuth(fixtures.employee);
    vi.mocked(prisma.evaluationTemplate.findFirst).mockResolvedValue({
      id: validCuid,
      name: "Standard 360",
      isGlobal: true,
      sections: [],
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`);
    const res = await callWith(GET, req, validCuid);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.data.name).toBe("Standard 360");
  });

  it("returns 404 for template not in company/global", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.evaluationTemplate.findFirst).mockResolvedValue(null);

    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`);
    const res = await callWith(GET, req, validCuid);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/templates/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates company-owned template", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.evaluationTemplate.findFirst).mockResolvedValue({
      id: validCuid,
      companyId: fixtures.admin.companyId,
      isGlobal: false,
    } as any);
    vi.mocked(prisma.evaluationTemplate.update).mockResolvedValue({
      id: validCuid,
      name: "Updated Template",
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`, {
      method: "PATCH",
      body: { name: "Updated Template" },
    });
    const res = await callWith(PATCH, req, validCuid);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.data.name).toBe("Updated Template");
  });

  it("returns 404 for global template (not editable)", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.evaluationTemplate.findFirst).mockResolvedValue(null);

    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`, {
      method: "PATCH",
      body: { name: "Hacked" },
    });
    const res = await callWith(PATCH, req, validCuid);
    expect(res.status).toBe(404);
  });

  it("rejects MEMBER role", async () => {
    mockAuth(fixtures.employee);
    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`, {
      method: "PATCH",
      body: { name: "X" },
    });
    const res = await callWith(PATCH, req, validCuid);
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/templates/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes unused company template", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.evaluationTemplate.findFirst).mockResolvedValue({
      id: validCuid,
      companyId: fixtures.admin.companyId,
      isGlobal: false,
    } as any);
    vi.mocked(prisma.cycleTeam.count).mockResolvedValue(0);
    vi.mocked(prisma.evaluationTemplate.delete).mockResolvedValue({} as any);

    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`, { method: "DELETE" });
    const res = await callWith(DELETE, req, validCuid);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it("rejects deleting template in use by active cycle", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.evaluationTemplate.findFirst).mockResolvedValue({
      id: validCuid,
      companyId: fixtures.admin.companyId,
      isGlobal: false,
    } as any);
    vi.mocked(prisma.cycleTeam.count).mockResolvedValue(2);

    const req = createMockRequest(`http://localhost:3000/api/templates/${validCuid}`, { method: "DELETE" });
    const res = await callWith(DELETE, req, validCuid);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(400);
    expect(body.code).toBe("IN_USE");
  });
});
