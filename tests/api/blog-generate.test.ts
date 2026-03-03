import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enqueue } from "@/lib/queue";
import { POST } from "@/app/api/admin/blog/generate/route";

// ─── Helpers ───

function mockSuperAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { email: "super@test.com" },
  } as any);
  vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue({
    id: "sa1",
    email: "super@test.com",
  } as any);
}

function mockNoAuth() {
  vi.mocked(auth).mockResolvedValue(null as any);
}

function createRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
) {
  const { method = "GET", body } = options;
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) as any;
}

// ─── Tests ───

describe("/api/admin/blog/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    mockNoAuth();
    const req = createRequest("http://localhost/api/admin/blog/generate", {
      method: "POST",
      body: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should enqueue generation job with default count", async () => {
    mockSuperAdmin();
    const req = createRequest("http://localhost/api/admin/blog/generate", {
      method: "POST",
      body: {},
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.jobId).toBe("job-123");
    expect(enqueue).toHaveBeenCalledWith(
      "blog.generate",
      expect.objectContaining({ count: expect.any(Number) }),
      { maxAttempts: 1 }
    );
  });

  it("should respect custom count", async () => {
    mockSuperAdmin();
    const req = createRequest("http://localhost/api/admin/blog/generate", {
      method: "POST",
      body: { count: 5 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.data.count).toBe(5);
  });

  it("should clamp count to max 10", async () => {
    mockSuperAdmin();
    const req = createRequest("http://localhost/api/admin/blog/generate", {
      method: "POST",
      body: { count: 99 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.data.count).toBe(10);
  });

  it("should clamp count to min 1", async () => {
    mockSuperAdmin();
    const req = createRequest("http://localhost/api/admin/blog/generate", {
      method: "POST",
      body: { count: -5 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.data.count).toBe(1);
  });
});
