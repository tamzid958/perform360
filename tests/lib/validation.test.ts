import { describe, it, expect } from "vitest";
import { isValidCuid } from "@/lib/validation";

describe("validation", () => {
  describe("isValidCuid", () => {
    it("accepts valid cuid strings", () => {
      expect(isValidCuid("clx1abc2def3ghi4jkl5mno6p")).toBe(true);
      expect(isValidCuid("cm1abcdefghijklmnopqrst")).toBe(true);
    });

    it("rejects strings not starting with c", () => {
      expect(isValidCuid("alx1abc2def3ghi4jkl5mno6p")).toBe(false);
    });

    it("rejects strings that are too short", () => {
      expect(isValidCuid("c12345")).toBe(false);
    });

    it("rejects strings with uppercase letters", () => {
      expect(isValidCuid("cABCDEFghijklmnopqrstuv")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidCuid("")).toBe(false);
    });

    it("rejects strings with special characters", () => {
      expect(isValidCuid("clx1abc2-ef3ghi4jkl5mno6")).toBe(false);
    });
  });
});
