import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cascadeDeleteCompany } from "@/lib/company-cascade-delete";
import { createMockRequest, parseResponse } from "../helpers";

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

const { GET, PATCH, DELETE } = await import(
  "@/app/api/admin/companies/[id]/route"
);

const validCuid = "clxyz1234567890abcdef";

describe("GET /api/admin/companies/[id] — edge cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for non-existent company", async () => {
    mockSuperAdmin();
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`);
    const res = await GET(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.error).toContain("Company not found");
  });

  it("returns 403 for non-super-admin", async () => {
    mockNotSuperAdmin();

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`);
    const res = await GET(req as any, { params: { id: validCuid } });
    expect(res.status).toBe(403);
  });

  it("returns company with encryption status and counts", async () => {
    mockSuperAdmin();
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: validCuid,
      name: "Acme",
      slug: "acme",
      logo: null,
      settings: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      encryptionSetupAt: new Date(),
      keyVersion: 2,
      _count: { users: 10, teams: 3, cycles: 2, templates: 5 },
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`);
    const res = await GET(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.encryptionConfigured).toBe(true);
    expect(body.data.userCount).toBe(10);
    expect(body.data.teamCount).toBe(3);
  });
});

describe("PATCH /api/admin/companies/[id] — edge cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 409 for duplicate slug", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findUnique)
      .mockResolvedValueOnce({ id: validCuid, slug: "old-slug" } as any) // existing
      .mockResolvedValueOnce({ id: "other-company", slug: "taken-slug" } as any); // slug check

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`, {
      method: "PATCH",
      body: { slug: "taken-slug" },
    });
    const res = await PATCH(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.error).toContain("slug already exists");
  });

  it("returns 404 for non-existent company", async () => {
    mockSuperAdmin();
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`, {
      method: "PATCH",
      body: { name: "New Name" },
    });
    const res = await PATCH(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.error).toContain("Company not found");
  });

  it("allows updating name without slug conflict", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: validCuid,
      slug: "acme",
      name: "Acme",
    } as any);

    vi.mocked(prisma.company.update).mockResolvedValue({
      id: validCuid,
      name: "Acme Corp",
      slug: "acme",
      logo: null,
      settings: null,
      updatedAt: new Date(),
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`, {
      method: "PATCH",
      body: { name: "Acme Corp" },
    });
    const res = await PATCH(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.name).toBe("Acme Corp");
  });
});

describe("DELETE /api/admin/companies/[id] — edge cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 409 when company has active cycles", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: validCuid,
      _count: { cycles: 2 },
    } as any);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`, {
      method: "DELETE",
    });
    const res = await DELETE(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.error).toContain("active evaluation cycles");
  });

  it("returns 404 for non-existent company", async () => {
    mockSuperAdmin();
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`, {
      method: "DELETE",
    });
    const res = await DELETE(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.error).toContain("Company not found");
  });

  it("deletes company with no active cycles", async () => {
    mockSuperAdmin();

    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: validCuid,
      _count: { cycles: 0 },
    } as any);
    vi.mocked(cascadeDeleteCompany).mockResolvedValue(undefined);

    const req = createMockRequest(`http://localhost:3000/api/admin/companies/${validCuid}`, {
      method: "DELETE",
    });
    const res = await DELETE(req as any, { params: { id: validCuid } });
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data.id).toBe(validCuid);
    expect(cascadeDeleteCompany).toHaveBeenCalledWith(validCuid);
  });
});
