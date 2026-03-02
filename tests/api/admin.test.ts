import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createMockRequest, parseResponse } from "../helpers";

// Super admin routes use withSuperAdmin wrapper which checks superAdmin table
function mockSuperAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { email: "super@admin.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as any);
  vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue({
    id: "sa-1",
    email: "super@admin.com",
  } as any);
}

function mockNotSuperAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { email: "regular@user.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as any);
  vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(null);
}

const { GET: getStats } = await import("@/app/api/admin/stats/route");
const { GET: getCompanies, POST: createCompany } = await import(
  "@/app/api/admin/companies/route"
);

describe("GET /api/admin/stats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 for non-super-admin", async () => {
    mockNotSuperAdmin();

    const req = createMockRequest("http://localhost:3000/api/admin/stats");
    const res = await getStats(req as any, { params: {} });
    expect(res.status).toBe(403);
  });

  it("returns platform stats", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.count)
      .mockResolvedValueOnce(10)  // totalCompanies
      .mockResolvedValueOnce(2);  // recentCompanies
    vi.mocked(prisma.user.count).mockResolvedValue(50);
    vi.mocked(prisma.evaluationCycle.count).mockResolvedValue(5);
    vi.mocked(prisma.evaluationTemplate.count).mockResolvedValue(3);
    vi.mocked(prisma.evaluationResponse.count).mockResolvedValue(100);

    const req = createMockRequest("http://localhost:3000/api/admin/stats");
    const res = await getStats(req as any, { params: {} });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.totalCompanies).toBe(10);
    expect(body.data.totalUsers).toBe(50);
  });
});

describe("GET /api/admin/companies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 for non-super-admin", async () => {
    mockNotSuperAdmin();
    const req = createMockRequest("http://localhost:3000/api/admin/companies");
    const res = await getCompanies(req as any, { params: {} });
    expect(res.status).toBe(403);
  });

  it("returns paginated company list", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findMany).mockResolvedValue([
      {
        id: "co-1",
        name: "Acme",
        slug: "acme",
        logo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        encryptionSetupAt: new Date(),
        keyVersion: 1,
        _count: { users: 5, teams: 2, cycles: 1 },
      },
    ] as any);
    vi.mocked(prisma.company.count).mockResolvedValue(1);

    const req = createMockRequest(
      "http://localhost:3000/api/admin/companies?page=1&limit=20"
    );
    const res = await getCompanies(req as any, { params: {} });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].encryptionConfigured).toBe(true);
    expect(body.pagination.total).toBe(1);
  });
});

describe("POST /api/admin/companies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 for non-super-admin", async () => {
    mockNotSuperAdmin();
    const req = createMockRequest("http://localhost:3000/api/admin/companies", {
      method: "POST",
      body: { name: "New Co" },
    });
    const res = await createCompany(req as any, { params: {} });
    expect(res.status).toBe(403);
  });

  it("creates a new company", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.company.create).mockResolvedValue({
      id: "co-new",
      name: "New Co",
      slug: "new-co",
      logo: null,
      createdAt: new Date(),
    } as any);

    const req = createMockRequest("http://localhost:3000/api/admin/companies", {
      method: "POST",
      body: { name: "New Co" },
    });
    const res = await createCompany(req as any, { params: {} });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.data.name).toBe("New Co");
  });

  it("rejects duplicate slug", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: "existing",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/admin/companies", {
      method: "POST",
      body: { name: "Existing Co", slug: "existing" },
    });
    const res = await createCompany(req as any, { params: {} });
    expect(res.status).toBe(409);
  });
});
