import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

vi.unmock("@/lib/blog-prompt");

const { buildSystemPrompt, buildArticlePrompt, validateArticleSchema } = await import(
  "@/lib/blog-prompt"
);

describe("Blog Prompt Builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildSystemPrompt", () => {
    it("returns a non-empty system prompt string", () => {
      const prompt = buildSystemPrompt();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(100);
    });

    it("mentions Performs360", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("Performs360");
    });

    it("includes voice instructions", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("VOICE:");
    });

    it("lists AI clichés to avoid", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("In today's fast-paced world");
      expect(prompt).toContain("Game-changer");
    });

    it("requires valid JSON output", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("valid JSON");
    });
  });

  describe("buildArticlePrompt", () => {
    it("includes existing titles when posts exist", async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
        { title: "How to Run a 360 Review", slug: "how-to-run", primaryKeyword: "360 review" },
        { title: "Performance Management Guide", slug: "perf-guide", primaryKeyword: "performance management" },
      ] as never);

      const prompt = await buildArticlePrompt();

      expect(prompt).toContain("How to Run a 360 Review");
      expect(prompt).toContain("Performance Management Guide");
    });

    it("omits existing titles block when no posts exist", async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);

      const prompt = await buildArticlePrompt();

      expect(prompt).not.toContain("EXISTING TITLES");
    });

    it("includes word count requirements from BLOG_CONFIG", async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);

      const prompt = await buildArticlePrompt();

      expect(prompt).toContain("800");
      expect(prompt).toContain("1500");
    });

    it("includes the JSON schema definition", async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);

      const prompt = await buildArticlePrompt();

      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"meta_title"');
      expect(prompt).toContain('"slug"');
      expect(prompt).toContain('"content_html"');
      expect(prompt).toContain('"semantic_keywords"');
    });

    it("includes SEO instructions", async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);

      const prompt = await buildArticlePrompt();

      expect(prompt).toContain("SEO:");
      expect(prompt).toContain("Primary keyword");
    });

    it("fetches only the 50 most recent posts", async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);

      await buildArticlePrompt();

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
        select: { title: true, slug: true, primaryKeyword: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });
  });

  describe("validateArticleSchema", () => {
    const validArticle = {
      title: "Test Article",
      meta_title: "Test Meta",
      slug: "test-article",
      excerpt: "Test excerpt",
      content_html: "<p>Content</p>",
      meta_description: "Meta description",
      primary_keyword: "test keyword",
      semantic_keywords: ["kw1", "kw2"],
    };

    it("returns true for valid article data", () => {
      expect(validateArticleSchema(validArticle)).toBe(true);
    });

    it("returns false when required field is missing", () => {
      const { title: _title, ...withoutTitle } = validArticle;
      expect(validateArticleSchema(withoutTitle)).toBe(false);
    });

    it("returns false when a field is null", () => {
      expect(validateArticleSchema({ ...validArticle, title: null })).toBe(false);
    });

    it("returns false when a field is undefined", () => {
      expect(validateArticleSchema({ ...validArticle, slug: undefined })).toBe(false);
    });

    it("returns false when semantic_keywords is not an array", () => {
      expect(
        validateArticleSchema({ ...validArticle, semantic_keywords: "not-array" })
      ).toBe(false);
    });

    it("returns true when semantic_keywords is empty array", () => {
      expect(
        validateArticleSchema({ ...validArticle, semantic_keywords: [] })
      ).toBe(true);
    });

    it("returns false for completely empty object", () => {
      expect(validateArticleSchema({})).toBe(false);
    });

    it("checks all required fields", () => {
      const requiredKeys = [
        "title", "meta_title", "slug", "excerpt",
        "content_html", "meta_description", "primary_keyword", "semantic_keywords",
      ];

      for (const key of requiredKeys) {
        const data = { ...validArticle };
        delete data[key as keyof typeof data];
        expect(validateArticleSchema(data)).toBe(false);
      }
    });
  });
});
