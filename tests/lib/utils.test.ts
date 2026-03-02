import { describe, it, expect } from "vitest";
import {
  getInitials,
  slugify,
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/utils";

describe("utils", () => {
  describe("getInitials", () => {
    it("extracts initials from full name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("handles single name", () => {
      expect(getInitials("Alice")).toBe("A");
    });

    it("truncates to 2 characters for long names", () => {
      expect(getInitials("John Michael Doe")).toBe("JM");
    });

    it("uppercases initials", () => {
      expect(getInitials("john doe")).toBe("JD");
    });
  });

  describe("slugify", () => {
    it("converts to lowercase kebab-case", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(slugify("Hello! @World#")).toBe("hello-world");
    });

    it("replaces underscores with hyphens", () => {
      expect(slugify("hello_world")).toBe("hello-world");
    });

    it("trims leading/trailing hyphens", () => {
      expect(slugify("-hello world-")).toBe("hello-world");
    });

    it("handles multiple spaces", () => {
      expect(slugify("hello   world")).toBe("hello-world");
    });
  });

  describe("parsePaginationParams", () => {
    it("parses default values", () => {
      const params = new URLSearchParams();
      const result = parsePaginationParams(params);
      expect(result).toEqual({ page: 1, limit: 20, search: undefined });
    });

    it("parses explicit page and limit", () => {
      const params = new URLSearchParams({ page: "3", limit: "50" });
      const result = parsePaginationParams(params);
      expect(result).toEqual({ page: 3, limit: 50, search: undefined });
    });

    it("clamps page to minimum 1", () => {
      const params = new URLSearchParams({ page: "-5" });
      const result = parsePaginationParams(params);
      expect(result.page).toBe(1);
    });

    it("clamps limit to maximum 100", () => {
      const params = new URLSearchParams({ limit: "500" });
      const result = parsePaginationParams(params);
      expect(result.limit).toBe(100);
    });

    it("clamps limit to minimum 1", () => {
      const params = new URLSearchParams({ limit: "0" });
      const result = parsePaginationParams(params);
      expect(result.limit).toBe(1);
    });

    it("parses search parameter", () => {
      const params = new URLSearchParams({ search: "test query" });
      const result = parsePaginationParams(params);
      expect(result.search).toBe("test query");
    });

    it("returns undefined for empty search", () => {
      const params = new URLSearchParams({ search: "   " });
      const result = parsePaginationParams(params);
      expect(result.search).toBeUndefined();
    });

    it("uses custom defaultLimit", () => {
      const params = new URLSearchParams();
      const result = parsePaginationParams(params, 12);
      expect(result.limit).toBe(12);
    });
  });

  describe("buildPaginationMeta", () => {
    it("calculates correct metadata", () => {
      const meta = buildPaginationMeta(1, 20, 55);
      expect(meta).toEqual({ page: 1, limit: 20, total: 55, totalPages: 3 });
    });

    it("handles exact division", () => {
      const meta = buildPaginationMeta(1, 10, 30);
      expect(meta.totalPages).toBe(3);
    });

    it("handles zero total", () => {
      const meta = buildPaginationMeta(1, 20, 0);
      expect(meta.totalPages).toBe(0);
    });

    it("handles single item", () => {
      const meta = buildPaginationMeta(1, 20, 1);
      expect(meta.totalPages).toBe(1);
    });
  });
});
