import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers cookies before importing the module
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDelete = vi.fn();
const mockCookieStore = { get: mockGet, set: mockSet, delete: mockDelete };

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Must import AFTER mocking next/headers (no global setup.ts mock for this module)
vi.unmock("@/lib/company-cookie");

const { getSelectedCompanyId, setSelectedCompany, clearSelectedCompany } =
  await import("@/lib/company-cookie");

describe("company-cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSelectedCompanyId", () => {
    it("returns null when no cookie is set", async () => {
      mockGet.mockReturnValue(undefined);

      const result = await getSelectedCompanyId();
      expect(result).toBeNull();
    });

    it("returns the company ID for a valid CUID cookie", async () => {
      mockGet.mockReturnValue({ value: "clx1abc2def3ghi4jkl5mno6p" });

      const result = await getSelectedCompanyId();
      expect(result).toBe("clx1abc2def3ghi4jkl5mno6p");
    });

    it("rejects and deletes a tampered cookie with invalid format", async () => {
      mockGet.mockReturnValue({ value: "tampered-value!" });

      const result = await getSelectedCompanyId();
      expect(result).toBeNull();
      expect(mockDelete).toHaveBeenCalledWith("p360_selected_company");
    });

    it("rejects and deletes a cookie with SQL injection attempt", async () => {
      mockGet.mockReturnValue({ value: "'; DROP TABLE users; --" });

      const result = await getSelectedCompanyId();
      expect(result).toBeNull();
      expect(mockDelete).toHaveBeenCalled();
    });

    it("treats empty string cookie as no selection", async () => {
      mockGet.mockReturnValue({ value: "" });

      // Empty string is falsy — `value && !isValidCuid(value)` won't trigger delete
      // Returns "" which is falsy, so consumers treat it as no selection
      const result = await getSelectedCompanyId();
      expect(result).toBeFalsy();
    });

    it("rejects a cookie with uppercase characters (not valid CUID)", async () => {
      mockGet.mockReturnValue({ value: "cABCDEFghijklmnopqrstuv" });

      const result = await getSelectedCompanyId();
      expect(result).toBeNull();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("setSelectedCompany", () => {
    it("sets an httpOnly cookie with correct options", async () => {
      await setSelectedCompany("clx1abc2def3ghi4jkl5mno6p");

      expect(mockSet).toHaveBeenCalledWith(
        "p360_selected_company",
        "clx1abc2def3ghi4jkl5mno6p",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        })
      );
    });
  });

  describe("clearSelectedCompany", () => {
    it("deletes the cookie", async () => {
      await clearSelectedCompany();

      expect(mockDelete).toHaveBeenCalledWith("p360_selected_company");
    });
  });
});
