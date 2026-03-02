import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth, mockNoAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { GET, PATCH } = await import("@/app/api/company/route");

describe("GET /api/company", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(fixtures.admin);
  });

  it("returns 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createMockRequest("http://localhost:3000/api/company");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns company profile", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: "co-1",
      name: "Acme",
      slug: "acme",
      logo: null,
      settings: {},
    } as any);

    const req = createMockRequest("http://localhost:3000/api/company");
    const res = await GET(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.name).toBe("Acme");
  });

  it("returns 404 when company not found", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = createMockRequest("http://localhost:3000/api/company");
    const res = await GET(req as any);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/company", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(fixtures.admin);
  });

  it("updates company name", async () => {
    vi.mocked(prisma.company.update).mockResolvedValue({
      id: "co-1",
      name: "Acme Corp",
      slug: "acme",
      logo: null,
      settings: {},
    } as any);

    const req = createMockRequest("http://localhost:3000/api/company", {
      method: "PATCH",
      body: { name: "Acme Corp" },
    });
    const res = await PATCH(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.name).toBe("Acme Corp");
  });

  it("rejects duplicate slug", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: "other-co",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/company", {
      method: "PATCH",
      body: { slug: "taken-slug" },
    });
    const res = await PATCH(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.code).toBe("DUPLICATE");
  });

  it("rejects invalid slug format", async () => {
    const req = createMockRequest("http://localhost:3000/api/company", {
      method: "PATCH",
      body: { slug: "INVALID SLUG!" },
    });
    const res = await PATCH(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects MEMBER role", async () => {
    mockAuth(fixtures.employee);
    const req = createMockRequest("http://localhost:3000/api/company", {
      method: "PATCH",
      body: { name: "New Name" },
    });
    const res = await PATCH(req as any);
    expect(res.status).toBe(403);
  });
});
