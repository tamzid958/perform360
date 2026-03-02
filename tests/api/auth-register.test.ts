import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireRecaptcha } from "@/lib/recaptcha";
import { createMockRequest, parseResponse } from "../helpers";

const { POST } = await import("@/app/api/auth/register/route");

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRecaptcha).mockResolvedValue(null);
  });

  it("registers a new company and admin user", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          company: {
            create: vi.fn().mockResolvedValue({ id: "co-new", name: "Acme", slug: "acme" }),
          },
          authUser: {
            upsert: vi.fn().mockResolvedValue({ id: "auth-1", email: "admin@acme.com" }),
          },
          user: {
            create: vi.fn().mockResolvedValue({ id: "u1", role: "ADMIN" }),
          },
        });
      }
    });

    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: {
        companyName: "Acme",
        name: "John Admin",
        email: "admin@acme.com",
        recaptchaToken: "tok",
      },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("allows same email to register a second company", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          company: {
            create: vi.fn().mockResolvedValue({ id: "co-2", name: "Beta Corp", slug: "beta-corp" }),
          },
          authUser: {
            upsert: vi.fn().mockResolvedValue({ id: "auth-1", email: "admin@acme.com" }),
          },
          user: {
            create: vi.fn().mockResolvedValue({ id: "u2", role: "ADMIN" }),
          },
        });
      }
    });

    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: {
        companyName: "Beta Corp",
        name: "John Admin",
        email: "admin@acme.com",
        recaptchaToken: "tok",
      },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("validates required fields", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: { companyName: "A", name: "", email: "bad" },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("appends random suffix when slug collides", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: "existing-co" } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          company: { create: vi.fn().mockResolvedValue({ id: "co-new" }) },
          authUser: { upsert: vi.fn().mockResolvedValue({ id: "auth-1" }) },
          user: { create: vi.fn().mockResolvedValue({ id: "u1" }) },
        });
      }
    });

    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: { companyName: "Acme", name: "Admin", email: "new@acme.com", recaptchaToken: "tok" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });
});
