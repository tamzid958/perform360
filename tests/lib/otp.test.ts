import { describe, it, expect } from "vitest";
import { hashOTP, verifyOTP, createOTP, isOTPExpired, isInCooldown, getCooldownEnd, getSessionExpiry, getSummarySessionExpiry } from "@/lib/otp";
import { OTP_CONFIG } from "@/lib/constants";

describe("otp", () => {
  describe("hashOTP / verifyOTP", () => {
    it("verifies a valid OTP", async () => {
      const hash = await hashOTP("123456");
      const valid = await verifyOTP("123456", hash);
      expect(valid).toBe(true);
    });

    it("rejects an invalid OTP", async () => {
      const hash = await hashOTP("123456");
      const valid = await verifyOTP("654321", hash);
      expect(valid).toBe(false);
    });
  });

  describe("createOTP", () => {
    it("returns an OTP and expiry date", () => {
      const { otp, expiresAt } = createOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("sets expiry based on OTP_CONFIG", () => {
      const before = Date.now();
      const { expiresAt } = createOTP();
      const after = Date.now();
      const expectedMin = before + OTP_CONFIG.expiryMinutes * 60 * 1000;
      const expectedMax = after + OTP_CONFIG.expiryMinutes * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("isOTPExpired", () => {
    it("returns true for past dates", () => {
      const past = new Date(Date.now() - 60_000);
      expect(isOTPExpired(past)).toBe(true);
    });

    it("returns false for future dates", () => {
      const future = new Date(Date.now() + 60_000);
      expect(isOTPExpired(future)).toBe(false);
    });
  });

  describe("isInCooldown", () => {
    it("returns false when cooldownUntil is null", () => {
      expect(isInCooldown(null)).toBe(false);
    });

    it("returns true when cooldown is in the future", () => {
      const future = new Date(Date.now() + 60_000);
      expect(isInCooldown(future)).toBe(true);
    });

    it("returns false when cooldown has passed", () => {
      const past = new Date(Date.now() - 60_000);
      expect(isInCooldown(past)).toBe(false);
    });
  });

  describe("getCooldownEnd", () => {
    it("returns a future date based on config", () => {
      const before = Date.now();
      const cooldownEnd = getCooldownEnd();
      const expected = before + OTP_CONFIG.cooldownMinutes * 60 * 1000;
      expect(cooldownEnd.getTime()).toBeGreaterThanOrEqual(expected);
    });
  });

  describe("getSessionExpiry", () => {
    it("returns a future date based on config", () => {
      const before = Date.now();
      const expiry = getSessionExpiry();
      const expected = before + OTP_CONFIG.sessionDurationHours * 60 * 60 * 1000;
      expect(expiry.getTime()).toBeGreaterThanOrEqual(expected);
    });
  });

  describe("getSummarySessionExpiry", () => {
    it("returns a future date based on summarySessionDurationHours config", () => {
      const before = Date.now();
      const expiry = getSummarySessionExpiry();
      const after = Date.now();
      const expectedMin = before + OTP_CONFIG.summarySessionDurationHours * 60 * 60 * 1000;
      const expectedMax = after + OTP_CONFIG.summarySessionDurationHours * 60 * 60 * 1000;
      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it("returns an expiry >= getSessionExpiry", () => {
      const summaryExpiry = getSummarySessionExpiry();
      const directExpiry = getSessionExpiry();
      expect(summaryExpiry.getTime()).toBeGreaterThanOrEqual(directExpiry.getTime());
    });
  });
});
