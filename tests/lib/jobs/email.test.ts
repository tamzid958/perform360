import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "@/lib/email";
import { handleEmailSend } from "@/lib/jobs/email";

describe("handleEmailSend", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends email with correct parameters", async () => {
    await handleEmailSend({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
    });
  });

  it("propagates email service errors", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP failed"));

    await expect(
      handleEmailSend({
        to: "user@example.com",
        subject: "Test",
        html: "",
        text: "",
      })
    ).rejects.toThrow("SMTP failed");
  });
});
