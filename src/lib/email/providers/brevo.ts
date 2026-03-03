import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailWithAttachmentsOptions,
} from "../types";

const DEFAULT_FROM =
  process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";

function getApiKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    throw new Error("BREVO_API_KEY env var is required for brevo provider");
  }
  return key;
}

function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: from };
}

interface BrevoSendPayload {
  sender: { name?: string; email: string };
  to: Array<{ email: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachment?: Array<{ name: string; content: string }>;
}

async function brevoSend(payload: BrevoSendPayload): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": getApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo: failed to send email (${res.status}): ${body}`);
  }
}

export const brevoProvider: EmailProvider = {
  async send({ to, subject, html, text }: SendEmailOptions) {
    const sender = parseFrom(DEFAULT_FROM);
    await brevoSend({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    });
  },

  async sendWithAttachments({
    to,
    subject,
    html,
    text,
    attachments,
  }: SendEmailWithAttachmentsOptions) {
    const sender = parseFrom(DEFAULT_FROM);
    await brevoSend({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
      attachment: attachments.map((a) => ({
        name: a.filename,
        content:
          typeof a.content === "string"
            ? a.content
            : a.content.toString("base64"),
      })),
    });
  },
};
