import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

describe("rate-limit", () => {
  describe("checkRateLimit", () => {
    const config = { maxRequests: 3, windowMs: 60_000 };

    it("allows first request", () => {
      const id = `test-${Date.now()}-${Math.random()}`;
      const result = checkRateLimit(id, config);
      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.remaining).toBe(2);
      }
    });

    it("decrements remaining on subsequent requests", () => {
      const id = `test-${Date.now()}-${Math.random()}`;
      checkRateLimit(id, config);
      const result = checkRateLimit(id, config);
      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.remaining).toBe(1);
      }
    });

    it("blocks after max requests exceeded", () => {
      const id = `test-${Date.now()}-${Math.random()}`;
      checkRateLimit(id, config);
      checkRateLimit(id, config);
      checkRateLimit(id, config);
      const result = checkRateLimit(id, config);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.retryAfterSeconds).toBeGreaterThan(0);
      }
    });

    it("uses separate counters per identifier", () => {
      const id1 = `test-a-${Date.now()}`;
      const id2 = `test-b-${Date.now()}`;
      checkRateLimit(id1, config);
      checkRateLimit(id1, config);
      checkRateLimit(id1, config);

      const result = checkRateLimit(id2, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });
      expect(getClientIp(request)).toBe("1.2.3.4");
    });

    it("extracts IP from x-real-ip header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "9.8.7.6" },
      });
      expect(getClientIp(request)).toBe("9.8.7.6");
    });

    it("returns 'unknown' when no IP headers present", () => {
      const request = new Request("http://localhost");
      expect(getClientIp(request)).toBe("unknown");
    });

    it("prefers x-forwarded-for over x-real-ip", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "1.2.3.4",
          "x-real-ip": "5.6.7.8",
        },
      });
      expect(getClientIp(request)).toBe("1.2.3.4");
    });
  });
});
