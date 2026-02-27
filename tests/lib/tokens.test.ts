import { describe, it, expect } from "vitest";
import { generateToken, generateOTP } from "@/lib/tokens";

describe("tokens", () => {
  describe("generateToken", () => {
    it("generates a 64-character hex string", () => {
      const token = generateToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("generates unique tokens", () => {
      const tokens = new Set(Array.from({ length: 50 }, () => generateToken()));
      expect(tokens.size).toBe(50);
    });
  });

  describe("generateOTP", () => {
    it("generates a 6-digit OTP by default", () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("generates OTP of specified length", () => {
      const otp = generateOTP(8);
      expect(otp).toMatch(/^\d{8}$/);
    });

    it("generates only digit characters", () => {
      for (let i = 0; i < 100; i++) {
        const otp = generateOTP();
        expect(otp).toMatch(/^\d+$/);
      }
    });
  });
});
