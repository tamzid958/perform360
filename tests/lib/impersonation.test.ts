import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Must un-mock impersonation for this test file
vi.unmock("@/lib/impersonation");

const { getImpersonation } = await import("@/lib/impersonation");

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

const validPayload = {
  superAdminId: "sa-1",
  superAdminEmail: "super@admin.com",
  companyId: "co-1",
  adminUserId: "user-admin-1",
  expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
};

describe("getImpersonation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue(undefined);
  });

  it("returns null when no impersonation cookie exists", async () => {
    const result = await getImpersonation();
    expect(result).toBeNull();
  });

  it("returns null and clears cookie for invalid base64", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-valid-json!@#" });

    const result = await getImpersonation();
    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("p360_impersonate");
  });

  it("returns null and clears cookie when required fields missing", async () => {
    const incomplete = { superAdminId: "sa-1" }; // missing other fields
    mockCookieStore.get.mockReturnValue({ value: encodePayload(incomplete) });

    const result = await getImpersonation();
    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });

  it("returns null and clears cookie when expired", async () => {
    const expired = {
      ...validPayload,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // already expired
    };
    mockCookieStore.get.mockReturnValue({ value: encodePayload(expired) });

    const result = await getImpersonation();
    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });

  it("returns null when super admin no longer exists", async () => {
    mockCookieStore.get.mockReturnValue({ value: encodePayload(validPayload) });
    vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(null);

    const result = await getImpersonation();
    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });

  it("returns null when admin user not found", async () => {
    mockCookieStore.get.mockReturnValue({ value: encodePayload(validPayload) });
    vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue({ id: "sa-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await getImpersonation();
    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });

  it("returns null when admin companyId does not match cookie", async () => {
    mockCookieStore.get.mockReturnValue({ value: encodePayload(validPayload) });
    vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue({ id: "sa-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-admin-1",
      email: "admin@company.com",
      role: "ADMIN",
      companyId: "co-OTHER", // mismatch
    } as any);

    const result = await getImpersonation();
    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });

  it("returns impersonation result for valid cookie", async () => {
    mockCookieStore.get.mockReturnValue({ value: encodePayload(validPayload) });
    vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue({ id: "sa-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-admin-1",
      email: "admin@company.com",
      role: "ADMIN",
      companyId: "co-1",
    } as any);

    const result = await getImpersonation();
    expect(result).toEqual({
      userId: "user-admin-1",
      email: "admin@company.com",
      role: "ADMIN",
      companyId: "co-1",
      superAdminEmail: "super@admin.com",
    });
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });
});
