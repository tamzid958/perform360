import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.unmock("@/lib/recaptcha-client");

describe("reCAPTCHA Client", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
    // Clean up window.grecaptcha
    if (typeof globalThis.window !== "undefined") {
      delete (globalThis.window as unknown as Record<string, unknown>).grecaptcha;
    }
  });

  function setupWindow() {
    // Simulate browser environment
    if (typeof globalThis.window === "undefined") {
      (globalThis as Record<string, unknown>).window = globalThis;
    }
  }

  describe("executeRecaptcha", () => {
    it("returns null when SITE_KEY is not configured", async () => {
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      setupWindow();

      const { executeRecaptcha } = await import("@/lib/recaptcha-client");
      const result = await executeRecaptcha("login");
      expect(result).toBeNull();
    });

    it("returns null when window is undefined (SSR)", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

      // Remove window to simulate SSR
      const originalWindow = globalThis.window;
      delete (globalThis as Record<string, unknown>).window;

      const { executeRecaptcha } = await import("@/lib/recaptcha-client");
      const result = await executeRecaptcha("login");
      expect(result).toBeNull();

      // Restore
      (globalThis as Record<string, unknown>).window = originalWindow;
    });

    it("returns token when grecaptcha is immediately available", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      setupWindow();

      (globalThis.window as unknown as Record<string, unknown>).grecaptcha = {
        ready: (cb: () => void) => cb(),
        execute: vi.fn().mockResolvedValue("recaptcha-token-123"),
      };

      const { executeRecaptcha } = await import("@/lib/recaptcha-client");
      const result = await executeRecaptcha("submit");

      expect(result).toBe("recaptcha-token-123");
      expect((globalThis.window as unknown as Record<string, unknown> & { grecaptcha: { execute: ReturnType<typeof vi.fn> } }).grecaptcha.execute).toHaveBeenCalledWith(
        "test-site-key",
        { action: "submit" }
      );
    });

    it("returns null when grecaptcha execute throws", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      setupWindow();

      (globalThis.window as unknown as Record<string, unknown>).grecaptcha = {
        ready: (cb: () => void) => cb(),
        execute: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      const { executeRecaptcha } = await import("@/lib/recaptcha-client");
      const result = await executeRecaptcha("login");
      expect(result).toBeNull();
    });

    it("waits for grecaptcha to become available", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      setupWindow();

      const { executeRecaptcha } = await import("@/lib/recaptcha-client");

      const resultPromise = executeRecaptcha("login");

      // Simulate grecaptcha loading after 200ms
      vi.advanceTimersByTime(200);
      (globalThis.window as unknown as Record<string, unknown>).grecaptcha = {
        ready: (cb: () => void) => cb(),
        execute: vi.fn().mockResolvedValue("delayed-token"),
      };
      vi.advanceTimersByTime(100);

      const result = await resultPromise;
      expect(result).toBe("delayed-token");
    });

    it("returns null when grecaptcha never loads (timeout)", async () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      setupWindow();

      const { executeRecaptcha } = await import("@/lib/recaptcha-client");

      const resultPromise = executeRecaptcha("login");

      // Advance past the 10s timeout
      vi.advanceTimersByTime(11000);

      const result = await resultPromise;
      expect(result).toBeNull();
    });
  });
});
