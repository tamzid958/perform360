import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET, PUT, DELETE } from "@/app/api/admin/blog/[id]/route";

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

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── Tests ───

describe("/api/admin/blog/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── GET ───

  describe("GET", () => {
    it("should return 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = createRequest("http://localhost/api/admin/blog/abc");
      const res = await GET(req, makeCtx("abc"));
      expect(res.status).toBe(401);
    });

    it("should return 404 when post not found", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const req = createRequest("http://localhost/api/admin/blog/nonexist");
      const res = await GET(req, makeCtx("nonexist"));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain("not found");
    });

    it("should return post when found", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
        title: "Test Post",
        slug: "test-post",
        contentHtml: "<p>Content</p>",
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1");
      const res = await GET(req, makeCtx("p1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe("p1");
    });
  });

  // ─── PUT ───

  describe("PUT", () => {
    it("should return 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "PUT",
        body: { title: "Updated" },
      });
      const res = await PUT(req, makeCtx("p1"));
      expect(res.status).toBe(401);
    });

    it("should return 404 when post not found", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const req = createRequest("http://localhost/api/admin/blog/nope", {
        method: "PUT",
        body: { title: "Updated" },
      });
      const res = await PUT(req, makeCtx("nope"));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain("not found");
    });

    it("should update post with sanitized fields", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
        status: "DRAFT",
      } as any);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({
        id: "p1",
        title: "Updated",
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "PUT",
        body: {
          title: "Updated",
          slug: "Updated Slug!",
          contentHtml: '<p>Clean</p><script>bad()</script>',
        },
      });
      const res = await PUT(req, makeCtx("p1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      const updateCall = vi.mocked(prisma.blogPost.update).mock.calls[0][0];
      expect(updateCall.data.slug).toBe("updated-slug");
      expect(updateCall.data.contentHtml).not.toContain("<script>");
    });

    it("should set publishedAt when transitioning DRAFT to PUBLISHED", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
        status: "DRAFT",
      } as any);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: "p1" } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "PUT",
        body: { status: "PUBLISHED" },
      });
      await PUT(req, makeCtx("p1"));

      const updateCall = vi.mocked(prisma.blogPost.update).mock.calls[0][0];
      expect(updateCall.data.status).toBe("PUBLISHED");
      expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
    });

    it("should set publishedAt to null when switching to DRAFT", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
      } as any);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: "p1" } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "PUT",
        body: { status: "DRAFT" },
      });
      await PUT(req, makeCtx("p1"));

      const updateCall = vi.mocked(prisma.blogPost.update).mock.calls[0][0];
      expect(updateCall.data.status).toBe("DRAFT");
      expect(updateCall.data.publishedAt).toBeNull();
    });

    it("should ignore invalid status values", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
        status: "DRAFT",
      } as any);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: "p1" } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "PUT",
        body: { status: "INVALID_STATUS" },
      });
      await PUT(req, makeCtx("p1"));

      const updateCall = vi.mocked(prisma.blogPost.update).mock.calls[0][0];
      expect(updateCall.data.status).toBeUndefined();
    });

    it("should return 400 when contentHtml is too large", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
        status: "DRAFT",
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "PUT",
        body: { contentHtml: "x".repeat(100_001) },
      });
      const res = await PUT(req, makeCtx("p1"));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("too large");
    });
  });

  // ─── DELETE ───

  describe("DELETE", () => {
    it("should return 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "DELETE",
      });
      const res = await DELETE(req, makeCtx("p1"));
      expect(res.status).toBe(401);
    });

    it("should return 404 when post not found", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const req = createRequest("http://localhost/api/admin/blog/nope", {
        method: "DELETE",
      });
      const res = await DELETE(req, makeCtx("nope"));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain("not found");
    });

    it("should delete post and return success", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: "p1",
      } as any);
      vi.mocked(prisma.blogPost.delete).mockResolvedValue({ id: "p1" } as any);

      const req = createRequest("http://localhost/api/admin/blog/p1", {
        method: "DELETE",
      });
      const res = await DELETE(req, makeCtx("p1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(prisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    });
  });
});
