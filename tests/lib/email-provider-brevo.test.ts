import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Unmock to test actual implementation
vi.unmock("@/lib/email");

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("Brevo Email Provider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.BREVO_API_KEY = "test-brevo-key";
    process.env.EMAIL_FROM = "Test <test@example.com>";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function getProvider() {
    const { brevoProvider } = await import("@/lib/email/providers/brevo");
    return brevoProvider;
  }

  describe("send", () => {
    it("sends email with correct payload", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      const provider = await getProvider();

      await provider.send({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/smtp/email",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "api-key": "test-brevo-key",
            "Content-Type": "application/json",
          }),
        })
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.sender).toEqual({ name: "Test", email: "test@example.com" });
      expect(body.to).toEqual([{ email: "user@test.com" }]);
      expect(body.subject).toBe("Hello");
      expect(body.htmlContent).toBe("<p>Hi</p>");
      expect(body.textContent).toBe("Hi");
    });

    it("omits textContent when text is not provided", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      const provider = await getProvider();

      await provider.send({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.textContent).toBeUndefined();
    });

    it("parses from address without name correctly", async () => {
      process.env.EMAIL_FROM = "noreply@example.com";
      fetchMock.mockResolvedValue({ ok: true });

      vi.resetModules();
      const { brevoProvider } = await import("@/lib/email/providers/brevo");

      await brevoProvider.send({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.sender).toEqual({ email: "noreply@example.com" });
      expect(body.sender.name).toBeUndefined();
    });

    it("throws on API error", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });
      const provider = await getProvider();

      await expect(
        provider.send({
          to: "user@test.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Brevo: failed to send email (401): Unauthorized");
    });

    it("throws when BREVO_API_KEY is missing", async () => {
      delete process.env.BREVO_API_KEY;
      vi.resetModules();
      const { brevoProvider } = await import("@/lib/email/providers/brevo");

      await expect(
        brevoProvider.send({
          to: "user@test.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("BREVO_API_KEY env var is required");
    });
  });

  describe("sendWithAttachments", () => {
    it("sends email with string attachments", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      const provider = await getProvider();

      await provider.sendWithAttachments({
        to: "user@test.com",
        subject: "Report",
        html: "<p>Attached</p>",
        attachments: [
          {
            filename: "report.pdf",
            content: "base64content",
            contentType: "application/pdf",
          },
        ],
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.attachment).toEqual([
        { name: "report.pdf", content: "base64content" },
      ]);
    });

    it("converts Buffer attachments to base64", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      const provider = await getProvider();
      const buffer = Buffer.from("hello world");

      await provider.sendWithAttachments({
        to: "user@test.com",
        subject: "Report",
        html: "<p>Attached</p>",
        attachments: [
          {
            filename: "data.bin",
            content: buffer,
            contentType: "application/octet-stream",
          },
        ],
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.attachment[0].content).toBe(buffer.toString("base64"));
    });

    it("handles multiple attachments", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      const provider = await getProvider();

      await provider.sendWithAttachments({
        to: "user@test.com",
        subject: "Reports",
        html: "<p>Attached</p>",
        attachments: [
          { filename: "a.pdf", content: "contentA", contentType: "application/pdf" },
          { filename: "b.pdf", content: "contentB", contentType: "application/pdf" },
        ],
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.attachment).toHaveLength(2);
    });
  });
});
