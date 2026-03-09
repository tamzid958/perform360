import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/blog-utils", () => ({
  decryptApiKey: vi.fn((key: string | null) => key ?? ""),
}));

const fetchMock = vi.fn();
global.fetch = fetchMock;

const { listModels, generate } = await import("@/lib/ollama");

function mockBlogSettings(overrides: Record<string, unknown> = {}) {
  vi.mocked(prisma.blogSettings.findUnique).mockResolvedValue({
    id: "singleton",
    ollamaApiUrl: "http://localhost:11434",
    ollamaModel: "llama3",
    ollamaApiKey: "test-api-key",
    ...overrides,
  } as never);
}

describe("Ollama Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listModels", () => {
    it("fetches available models", async () => {
      mockBlogSettings();
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { name: "llama3", model: "llama3", size: 4000000000 },
            { name: "mistral", model: "mistral", size: 3000000000 },
          ],
        }),
      });

      const models = await listModels();
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe("llama3");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:11434/api/tags",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
    });

    it("returns empty array when no models available", async () => {
      mockBlogSettings();
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const models = await listModels();
      expect(models).toEqual([]);
    });

    it("throws when blog settings not configured", async () => {
      vi.mocked(prisma.blogSettings.findUnique).mockResolvedValue(null);

      await expect(listModels()).rejects.toThrow("Blog settings not configured");
    });

    it("throws when ollamaApiUrl is missing", async () => {
      vi.mocked(prisma.blogSettings.findUnique).mockResolvedValue({
        id: "singleton",
        ollamaApiUrl: null,
      } as never);

      await expect(listModels()).rejects.toThrow("Blog settings not configured");
    });

    it("throws on API error", async () => {
      mockBlogSettings();
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(listModels()).rejects.toThrow("Ollama /api/tags failed: 500");
    });

    it("strips trailing slash from API URL", async () => {
      mockBlogSettings({ ollamaApiUrl: "http://localhost:11434/" });
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      await listModels();
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:11434/api/tags",
        expect.anything()
      );
    });

    it("omits Authorization header when API key is empty", async () => {
      mockBlogSettings({ ollamaApiKey: null });
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      await listModels();
      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe("generate", () => {
    it("generates text with preferred model", async () => {
      mockBlogSettings();

      // listModels call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: "llama3" }] }),
      });

      // generate call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: "llama3",
          response: "Generated article content",
          done: true,
          eval_count: 500,
        }),
      });

      const result = await generate("Write an article", "System prompt");
      expect(result).toBe("Generated article content");
    });

    it("falls back to another model when preferred fails", async () => {
      mockBlogSettings({ ollamaModel: "unavailable-model" });

      // listModels call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: "mistral" }] }),
      });

      // First model fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("model not found"),
      });

      // Fallback model succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: "mistral",
          response: "Fallback response",
          done: true,
        }),
      });

      const result = await generate("Write something");
      expect(result).toBe("Fallback response");
    });

    it("throws when all models fail", async () => {
      mockBlogSettings({ ollamaModel: "model1" });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: "model2" }] }),
      });

      // Both models fail
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("error"),
      });
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("error"),
      });

      await expect(generate("prompt")).rejects.toThrow("All Ollama models failed");
    });

    it("throws when no models available at all", async () => {
      mockBlogSettings({ ollamaModel: null });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      await expect(generate("prompt")).rejects.toThrow("No Ollama models available");
    });

    it("throws on empty response from model", async () => {
      mockBlogSettings();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: "llama3",
          response: "",
          done: true,
        }),
      });

      await expect(generate("prompt")).rejects.toThrow("All Ollama models failed");
    });

    it("sends system prompt and custom options", async () => {
      mockBlogSettings();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: "llama3",
          response: "Result",
          done: true,
        }),
      });

      await generate("prompt text", "system text", {
        temperature: 0.5,
        numPredict: 2048,
        numCtx: 4096,
        topP: 0.8,
      });

      // The generate call is the second fetch
      const body = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(body.system).toBe("system text");
      expect(body.prompt).toBe("prompt text");
      expect(body.stream).toBe(false);
      expect(body.options.temperature).toBe(0.5);
      expect(body.options.num_predict).toBe(2048);
      expect(body.options.num_ctx).toBe(4096);
      expect(body.options.top_p).toBe(0.8);
    });

    it("uses default options when none provided", async () => {
      mockBlogSettings();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: "llama3",
          response: "Result",
          done: true,
        }),
      });

      await generate("prompt");

      const body = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(body.options.temperature).toBe(0.7);
      expect(body.options.num_predict).toBe(4096);
      expect(body.options.num_ctx).toBe(8192);
      expect(body.options.top_p).toBe(0.9);
      expect(body.system).toBeUndefined();
    });

    it("continues with preferred model when listModels fails", async () => {
      mockBlogSettings({ ollamaModel: "llama3" });

      // listModels fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Error",
      });

      // But generate with preferred model succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: "llama3",
          response: "Generated",
          done: true,
        }),
      });

      const result = await generate("prompt");
      expect(result).toBe("Generated");
    });
  });
});
