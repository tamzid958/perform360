import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { mockAuth, fixtures, createMockRequest, parseResponse } from "../helpers";

const { POST } = await import("@/app/api/users/invite/route");

describe("Integration: User Invite Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ADMIN invites a new user and email is sent", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          authUser: { upsert: vi.fn().mockResolvedValue({ id: "auth-u1", email: "new@test.com" }) },
          user: {
            create: vi.fn().mockResolvedValue({
              id: "user-new",
              email: "new@test.com",
              name: "New User",
              role: "MEMBER",
              companyId: fixtures.admin.companyId,
            }),
          },
        });
      }
      return null;
    });
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: fixtures.admin.companyId, name: "Acme" } as any);

    const req = createMockRequest("http://localhost:3000/api/users/invite", {
      method: "POST",
      body: { name: "New User", email: "new@test.com", role: "MEMBER" },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.emailSent).toBe(true);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user_invite",
        metadata: expect.objectContaining({ email: "new@test.com", role: "MEMBER" }),
      })
    );
    expect(sendEmail).toHaveBeenCalled();
  });

  it("rejects duplicate email in same company", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing", email: "dup@test.com" } as any);

    const req = createMockRequest("http://localhost:3000/api/users/invite", {
      method: "POST",
      body: { name: "Dupe", email: "dup@test.com", role: "MEMBER" },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.code).toBe("DUPLICATE");
  });

  it("HR cannot assign ADMIN role", async () => {
    mockAuth(fixtures.hr);

    const req = createMockRequest("http://localhost:3000/api/users/invite", {
      method: "POST",
      body: { name: "Admin", email: "admin2@test.com", role: "ADMIN" },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("ADMIN can assign ADMIN role", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          authUser: { upsert: vi.fn().mockResolvedValue({ id: "auth-u2" }) },
          user: {
            create: vi.fn().mockResolvedValue({
              id: "user-admin2",
              email: "admin2@test.com",
              name: "Admin 2",
              role: "ADMIN",
              companyId: fixtures.admin.companyId,
            }),
          },
        });
      }
      return null;
    });
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: fixtures.admin.companyId, name: "Acme" } as any);

    const req = createMockRequest("http://localhost:3000/api/users/invite", {
      method: "POST",
      body: { name: "Admin 2", email: "admin2@test.com", role: "ADMIN" },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(201);
  });

  it("MEMBER cannot invite users", async () => {
    mockAuth(fixtures.member);

    const req = createMockRequest("http://localhost:3000/api/users/invite", {
      method: "POST",
      body: { name: "User", email: "user@test.com", role: "MEMBER" },
    });
    const res = await POST(req as any);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("handles email send failure gracefully", async () => {
    mockAuth(fixtures.admin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      if (typeof cb === "function") {
        return cb({
          authUser: { upsert: vi.fn().mockResolvedValue({ id: "auth-u3" }) },
          user: {
            create: vi.fn().mockResolvedValue({
              id: "user-fail",
              email: "fail@test.com",
              name: "Fail",
              role: "MEMBER",
              companyId: fixtures.admin.companyId,
            }),
          },
        });
      }
      return null;
    });
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: fixtures.admin.companyId, name: "Acme" } as any);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP failure"));

    const req = createMockRequest("http://localhost:3000/api/users/invite", {
      method: "POST",
      body: { name: "Fail", email: "fail@test.com", role: "MEMBER" },
    });
    const res = await POST(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.emailSent).toBe(false);
  });
});
