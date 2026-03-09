import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.unmock("@/lib/email");

const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: mockSendMail,
    }),
  },
}));

describe("SMTP Email Provider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.EMAIL_FROM = "Test <test@example.com>";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function getProvider() {
    const { smtpProvider } = await import("@/lib/email/providers/smtp");
    return smtpProvider;
  }

  describe("send", () => {
    it("sends email via nodemailer", async () => {
      mockSendMail.mockResolvedValue({});
      const provider = await getProvider();

      await provider.send({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Test <test@example.com>",
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      });
    });

    it("omits text when not provided", async () => {
      mockSendMail.mockResolvedValue({});
      const provider = await getProvider();

      await provider.send({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
      });

      const call = mockSendMail.mock.calls[0][0];
      expect(call.text).toBeUndefined();
    });

    it("throws when SMTP_HOST is missing", async () => {
      delete process.env.SMTP_HOST;
      vi.resetModules();

      vi.doMock("nodemailer", () => ({
        default: {
          createTransport: vi.fn().mockReturnValue({ sendMail: mockSendMail }),
        },
      }));

      const { smtpProvider } = await import("@/lib/email/providers/smtp");

      await expect(
        smtpProvider.send({
          to: "user@test.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("SMTP_HOST env var is required");
    });

    it("propagates sendMail errors", async () => {
      mockSendMail.mockRejectedValue(new Error("Connection refused"));
      const provider = await getProvider();

      await expect(
        provider.send({
          to: "user@test.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Connection refused");
    });
  });

  describe("sendWithAttachments", () => {
    it("converts base64 string content to Buffer", async () => {
      mockSendMail.mockResolvedValue({});
      const provider = await getProvider();
      const base64 = Buffer.from("hello").toString("base64");

      await provider.sendWithAttachments({
        to: "user@test.com",
        subject: "Report",
        html: "<p>Attached</p>",
        attachments: [
          {
            filename: "report.pdf",
            content: base64,
            contentType: "application/pdf",
          },
        ],
      });

      const call = mockSendMail.mock.calls[0][0];
      expect(Buffer.isBuffer(call.attachments[0].content)).toBe(true);
      expect(call.attachments[0].content.toString()).toBe("hello");
    });

    it("passes Buffer content directly", async () => {
      mockSendMail.mockResolvedValue({});
      const provider = await getProvider();
      const buffer = Buffer.from("binary data");

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

      const call = mockSendMail.mock.calls[0][0];
      expect(call.attachments[0].content).toBe(buffer);
    });

    it("maps contentType correctly", async () => {
      mockSendMail.mockResolvedValue({});
      const provider = await getProvider();

      await provider.sendWithAttachments({
        to: "user@test.com",
        subject: "Report",
        html: "<p>Attached</p>",
        attachments: [
          { filename: "a.pdf", content: "aa", contentType: "application/pdf" },
          { filename: "b.xlsx", content: "bb", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        ],
      });

      const call = mockSendMail.mock.calls[0][0];
      expect(call.attachments).toHaveLength(2);
      expect(call.attachments[0].contentType).toBe("application/pdf");
      expect(call.attachments[1].contentType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });
  });
});
