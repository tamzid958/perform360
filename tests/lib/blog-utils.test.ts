import { describe, it, expect, beforeAll } from "vitest";
import {
  sanitizeHtml,
  sanitizeSlug,
  safeJsonLdStringify,
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  validateOllamaUrl,
  validateContentSize,
} from "@/lib/blog-utils";

// Ensure NEXTAUTH_SECRET is set for encryption tests
beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-vitest-blog-utils";
});

describe("blog-utils", () => {
  // ─── sanitizeHtml ───

  describe("sanitizeHtml", () => {
    it("should keep allowed tags", () => {
      const input = "<h2>Title</h2><p>Paragraph with <strong>bold</strong> and <em>italic</em></p>";
      const result = sanitizeHtml(input);
      expect(result).toContain("<h2>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
    });

    it("should strip script tags", () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
      expect(result).toContain("<p>Hello</p>");
    });

    it("should strip img tags", () => {
      const input = '<p>Text</p><img src="x" onerror="alert(1)" />';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<img");
      expect(result).not.toContain("onerror");
    });

    it("should strip event handler attributes", () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("onclick");
      expect(result).toContain("<p>");
    });

    it("should allow href on anchor tags", () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="https://example.com"');
    });

    it("should strip style tags and attributes", () => {
      const input = '<p style="color:red">Text</p><style>body{}</style>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("style");
      expect(result).toContain("<p>");
    });

    it("should handle empty string", () => {
      expect(sanitizeHtml("")).toBe("");
    });
  });

  // ─── sanitizeSlug ───

  describe("sanitizeSlug", () => {
    it("should lowercase and replace spaces with hyphens", () => {
      expect(sanitizeSlug("Hello World")).toBe("hello-world");
    });

    it("should strip special characters", () => {
      // "Hello! @World#" → lowercase → "hello! @world#" → replace non-alnum → "hello---world-" → collapse → "hello-world-" → trim → "hello-world"
      expect(sanitizeSlug("Hello! @World#")).toBe("hello-world");
    });

    it("should collapse consecutive hyphens", () => {
      expect(sanitizeSlug("hello---world")).toBe("hello-world");
    });

    it("should trim leading and trailing hyphens", () => {
      expect(sanitizeSlug("-hello-world-")).toBe("hello-world");
    });

    it("should handle already valid slugs", () => {
      expect(sanitizeSlug("valid-slug-123")).toBe("valid-slug-123");
    });

    it("should handle empty string", () => {
      expect(sanitizeSlug("")).toBe("");
    });
  });

  // ─── safeJsonLdStringify ───

  describe("safeJsonLdStringify", () => {
    it("should escape closing script tags", () => {
      const data = { name: "Test</script><script>alert(1)" };
      const result = safeJsonLdStringify(data);
      expect(result).not.toContain("</script>");
      expect(result).toContain("<\\/script>");
    });

    it("should produce valid JSON with escaped slashes", () => {
      const data = { "@type": "Article", name: "Test" };
      const result = safeJsonLdStringify(data);
      expect(result).toContain('"@type":"Article"');
    });

    it("should handle data without script tags normally", () => {
      const data = { title: "Hello World" };
      const result = safeJsonLdStringify(data);
      expect(result).toBe('{"title":"Hello World"}');
    });
  });

  // ─── encryptApiKey / decryptApiKey ───

  describe("encryptApiKey / decryptApiKey", () => {
    it("should round-trip encrypt and decrypt", () => {
      const original = "sk-my-secret-api-key-12345";
      const encrypted = encryptApiKey(original);
      expect(encrypted).not.toBe(original);
      expect(encrypted).toContain(":"); // iv:tag:ciphertext format

      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(original);
    });

    it("should return empty string for empty input", () => {
      expect(encryptApiKey("")).toBe("");
    });

    it("should return as-is for legacy plaintext (no colons)", () => {
      expect(decryptApiKey("plain-key-no-colons")).toBe("plain-key-no-colons");
    });

    it("should return empty string for empty stored value", () => {
      expect(decryptApiKey("")).toBe("");
    });

    it("should return empty for invalid format", () => {
      // "a:b" includes ":" so passes first check, then splits to 2 parts (not 3) → empty
      expect(decryptApiKey("a:b")).toBe("");
      // "a:b:c:d" splits to 4 parts (not 3) → empty
      expect(decryptApiKey("a:b:c:d")).toBe("");
    });

    it("should produce different ciphertext each time (random IV)", () => {
      const key = "my-api-key";
      const enc1 = encryptApiKey(key);
      const enc2 = encryptApiKey(key);
      expect(enc1).not.toBe(enc2);
    });
  });

  // ─── maskApiKey ───

  describe("maskApiKey", () => {
    it("should mask middle of long keys", () => {
      const result = maskApiKey("sk-1234567890abcdef");
      expect(result).toMatch(/^sk-1\*+cdef$/);
      expect(result.length).toBe("sk-1234567890abcdef".length);
    });

    it("should fully mask short keys (8 chars or less)", () => {
      expect(maskApiKey("12345678")).toBe("********");
      expect(maskApiKey("short")).toBe("*****");
    });

    it("should return empty for empty string", () => {
      expect(maskApiKey("")).toBe("");
    });

    it("should show first 4 and last 4 of 9+ char keys", () => {
      const result = maskApiKey("123456789");
      expect(result).toBe("1234*6789");
    });
  });

  // ─── validateOllamaUrl ───

  describe("validateOllamaUrl", () => {
    it("should accept valid https URL", () => {
      expect(validateOllamaUrl("https://api.ollama.example.com")).toEqual({ valid: true });
    });

    it("should accept valid http URL", () => {
      expect(validateOllamaUrl("http://ollama.example.com")).toEqual({ valid: true });
    });

    it("should reject localhost", () => {
      const result = validateOllamaUrl("http://localhost:11434");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Internal");
    });

    it("should reject 127.0.0.1", () => {
      const result = validateOllamaUrl("http://127.0.0.1:11434");
      expect(result.valid).toBe(false);
    });

    it("should reject 0.0.0.0", () => {
      const result = validateOllamaUrl("http://0.0.0.0:11434");
      expect(result.valid).toBe(false);
    });

    it("should reject cloud metadata IP", () => {
      const result = validateOllamaUrl("http://169.254.169.254/latest/meta-data");
      expect(result.valid).toBe(false);
    });

    it("should reject 10.x private range", () => {
      const result = validateOllamaUrl("http://10.0.0.1:11434");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Private");
    });

    it("should reject 192.168.x private range", () => {
      const result = validateOllamaUrl("http://192.168.1.1:11434");
      expect(result.valid).toBe(false);
    });

    it("should reject 172.16-31 private range", () => {
      expect(validateOllamaUrl("http://172.16.0.1:11434").valid).toBe(false);
      expect(validateOllamaUrl("http://172.31.255.1:11434").valid).toBe(false);
    });

    it("should allow 172.x outside private range", () => {
      expect(validateOllamaUrl("http://172.15.0.1:11434").valid).toBe(true);
      expect(validateOllamaUrl("http://172.32.0.1:11434").valid).toBe(true);
    });

    it("should reject .internal domains", () => {
      const result = validateOllamaUrl("http://service.internal:11434");
      expect(result.valid).toBe(false);
    });

    it("should reject .local domains", () => {
      const result = validateOllamaUrl("http://server.local:11434");
      expect(result.valid).toBe(false);
    });

    it("should reject non-http protocols", () => {
      const result = validateOllamaUrl("ftp://ollama.example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("protocol");
    });

    it("should reject invalid URL format", () => {
      const result = validateOllamaUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid URL");
    });
  });

  // ─── validateContentSize ───

  describe("validateContentSize", () => {
    it("should accept content under limit", () => {
      expect(validateContentSize("<p>Small content</p>")).toEqual({ valid: true });
    });

    it("should reject content over 100KB", () => {
      const largeContent = "x".repeat(100_001);
      const result = validateContentSize(largeContent);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too large");
    });

    it("should accept content at exactly 100KB", () => {
      const exactContent = "x".repeat(100_000);
      expect(validateContentSize(exactContent)).toEqual({ valid: true });
    });

    it("should accept empty string", () => {
      expect(validateContentSize("")).toEqual({ valid: true });
    });
  });
});
