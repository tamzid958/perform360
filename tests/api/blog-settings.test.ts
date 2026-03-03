import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET, PUT } from "@/app/api/admin/blog/settings/route";

// Ensure NEXTAUTH_SECRET is set for encryption
beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-vitest-blog-settings";
});

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

describe("/api/admin/blog/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── GET ───

  describe("GET", () => {
    it("should return 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("should return settings with masked API key", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "https://api.example.com",
        ollamaApiKey: "", // No key stored
        ollamaModel: "llama3.3",
      } as any);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.ollamaApiUrl).toBe("https://api.example.com");
      expect(body.data.ollamaModel).toBe("llama3.3");
      expect(body.data.hasApiKey).toBe(false);
    });

    it("should indicate hasApiKey when key is stored", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "https://api.example.com",
        ollamaApiKey: "some-encrypted-value",
        ollamaModel: "llama3.3",
        generationPaused: false,
      } as any);

      const res = await GET();
      const body = await res.json();

      expect(body.data.hasApiKey).toBe(true);
    });

    it("should return generationPaused as false by default", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "",
        generationPaused: false,
      } as any);

      const res = await GET();
      const body = await res.json();

      expect(body.data.generationPaused).toBe(false);
    });

    it("should return generationPaused as true when paused", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "",
        generationPaused: true,
      } as any);

      const res = await GET();
      const body = await res.json();

      expect(body.data.generationPaused).toBe(true);
    });
  });

  // ─── PUT ───

  describe("PUT", () => {
    it("should return 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaModel: "llama3" },
      });
      const res = await PUT(req);
      expect(res.status).toBe(401);
    });

    it("should reject localhost URL (SSRF prevention)", async () => {
      mockSuperAdmin();
      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaApiUrl: "http://localhost:11434" },
      });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Internal");
    });

    it("should reject private network URLs", async () => {
      mockSuperAdmin();
      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaApiUrl: "http://192.168.1.1:11434" },
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
    });

    it("should accept valid public URL", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "https://api.example.com",
        ollamaApiKey: "",
        ollamaModel: "llama3.3",
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaApiUrl: "https://api.example.com" },
      });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should encrypt API key before storing", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "encrypted-data",
        ollamaModel: "llama3.3",
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaApiKey: "sk-my-secret-key" },
      });
      await PUT(req);

      const upsertCall = vi.mocked(prisma.blogSettings.upsert).mock.calls[0][0];
      const storedKey = (upsertCall.update as any).ollamaApiKey;
      // Encrypted key should be base64 format with colons
      expect(storedKey).toContain(":");
      expect(storedKey).not.toBe("sk-my-secret-key");
    });

    it("should store empty string when API key is cleared", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "llama3.3",
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaApiKey: "" },
      });
      await PUT(req);

      const upsertCall = vi.mocked(prisma.blogSettings.upsert).mock.calls[0][0];
      expect((upsertCall.update as any).ollamaApiKey).toBe("");
    });

    it("should update model without affecting other fields", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "new-model",
        generationPaused: false,
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaModel: "new-model" },
      });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.ollamaModel).toBe("new-model");
    });

    it("should pause generation when generationPaused is true", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "",
        generationPaused: true,
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { generationPaused: true },
      });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.generationPaused).toBe(true);
      const upsertCall = vi.mocked(prisma.blogSettings.upsert).mock.calls[0][0];
      expect((upsertCall.update as any).generationPaused).toBe(true);
    });

    it("should resume generation when generationPaused is false", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "",
        generationPaused: false,
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { generationPaused: false },
      });
      await PUT(req);

      const upsertCall = vi.mocked(prisma.blogSettings.upsert).mock.calls[0][0];
      expect((upsertCall.update as any).generationPaused).toBe(false);
    });

    it("should not include generationPaused when not in body", async () => {
      mockSuperAdmin();
      vi.mocked(prisma.blogSettings.upsert).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: "",
        ollamaApiKey: "",
        ollamaModel: "llama3",
        generationPaused: false,
      } as any);

      const req = createRequest("http://localhost/api/admin/blog/settings", {
        method: "PUT",
        body: { ollamaModel: "llama3" },
      });
      await PUT(req);

      const upsertCall = vi.mocked(prisma.blogSettings.upsert).mock.calls[0][0];
      expect((upsertCall.update as any).generationPaused).toBeUndefined();
    });
  });
});
