import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.unmock("@/lib/recaptcha");

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("reCAPTCHA Server Verification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function getModule() {
    process.env.RECAPTCHA_SECRET_KEY = "test-recaptcha-secret";
    const { requireRecaptcha } = await import("@/lib/recaptcha");
    return { requireRecaptcha };
  }

  describe("requireRecaptcha", () => {
    it("returns null when RECAPTCHA_SECRET_KEY is not configured", async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;
      const { requireRecaptcha } = await import("@/lib/recaptcha");

      const result = await requireRecaptcha("some-token");
      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns 400 when token is null", async () => {
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha(null);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(400);

      const body = await result!.json();
      expect(body.error).toBe("reCAPTCHA verification required");
    });

    it("returns 400 when token is undefined", async () => {
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha(undefined);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(400);
    });

    it("returns null on successful verification with high score", async () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ success: true, score: 0.9, action: "login" }),
      });
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha("valid-token");
      expect(result).toBeNull();
    });

    it("returns null when score is exactly 0.5 (threshold)", async () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ success: true, score: 0.5 }),
      });
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha("valid-token");
      expect(result).toBeNull();
    });

    it("returns 403 when score is below threshold", async () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ success: true, score: 0.3 }),
      });
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha("bot-token");
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);

      const body = await result!.json();
      expect(body.error).toBe("reCAPTCHA verification failed");
    });

    it("returns 403 when success is false", async () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ success: false, "error-codes": ["invalid-input-response"] }),
      });
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha("invalid-token");
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it("returns null when success is true and no score (v2 fallback)", async () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });
      const { requireRecaptcha } = await getModule();

      const result = await requireRecaptcha("v2-token");
      expect(result).toBeNull();
    });

    it("sends correct verification request to Google", async () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ success: true, score: 0.9 }),
      });
      const { requireRecaptcha } = await getModule();

      await requireRecaptcha("test-token-123");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://www.google.com/recaptcha/api/siteverify",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
      );

      const bodyParams = new URLSearchParams(fetchMock.mock.calls[0][1].body);
      expect(bodyParams.get("secret")).toBe("test-recaptcha-secret");
      expect(bodyParams.get("response")).toBe("test-token-123");
    });
  });
});
