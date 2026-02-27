import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.unmock("@/lib/email");

// Mock the Resend SDK with a proper class
const mockSend = vi.fn();

class MockResend {
  emails = { send: mockSend };
}

vi.mock("resend", () => ({
  Resend: MockResend,
}));

describe("Resend Email Provider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.EMAIL_FROM = "Test <test@example.com>";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function getProvider() {
    // Re-mock resend on each call after resetModules
    vi.doMock("resend", () => ({ Resend: MockResend }));
    const { resendProvider } = await import("@/lib/email/providers/resend");
    return resendProvider;
  }

  describe("send", () => {
    it("sends email with correct parameters", async () => {
      mockSend.mockResolvedValue({ error: null });
      const provider = await getProvider();

      await provider.send({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      });

      expect(mockSend).toHaveBeenCalledWith({
        from: "Test <test@example.com>",
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      });
    });

    it("omits text when not provided", async () => {
      mockSend.mockResolvedValue({ error: null });
      const provider = await getProvider();

      await provider.send({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.text).toBeUndefined();
    });

    it("throws on Resend error", async () => {
      mockSend.mockResolvedValue({ error: { message: "Rate limit exceeded" } });
      const provider = await getProvider();

      await expect(
        provider.send({
          to: "user@test.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Resend: failed to send email: Rate limit exceeded");
    });

    it("throws when RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;
      vi.doMock("resend", () => ({ Resend: MockResend }));
      const { resendProvider } = await import("@/lib/email/providers/resend");

      await expect(
        resendProvider.send({
          to: "user@test.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("RESEND_API_KEY env var is required");
    });
  });

  describe("sendWithAttachments", () => {
    it("converts string content to Buffer", async () => {
      mockSend.mockResolvedValue({ error: null });
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

      const call = mockSend.mock.calls[0][0];
      expect(call.attachments[0].filename).toBe("report.pdf");
      expect(Buffer.isBuffer(call.attachments[0].content)).toBe(true);
      expect(call.attachments[0].contentType).toBe("application/pdf");
    });

    it("passes Buffer content directly", async () => {
      mockSend.mockResolvedValue({ error: null });
      const provider = await getProvider();
      const buffer = Buffer.from("hello");

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

      const call = mockSend.mock.calls[0][0];
      expect(call.attachments[0].content).toBe(buffer);
    });

    it("throws on error with attachments", async () => {
      mockSend.mockResolvedValue({ error: { message: "Attachment too large" } });
      const provider = await getProvider();

      await expect(
        provider.sendWithAttachments({
          to: "user@test.com",
          subject: "Report",
          html: "<p>Attached</p>",
          attachments: [
            { filename: "big.zip", content: "data", contentType: "application/zip" },
          ],
        })
      ).rejects.toThrow("Resend: failed to send email: Attachment too large");
    });
  });
});
