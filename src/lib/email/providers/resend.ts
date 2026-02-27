import { Resend } from "resend";
import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailWithAttachmentsOptions,
} from "../types";

const DEFAULT_FROM =
  process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY env var is required for resend provider");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const resendProvider: EmailProvider = {
  async send({ to, subject, html, text }: SendEmailOptions) {
    const { error } = await getResend().emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (error) {
      throw new Error(`Resend: failed to send email: ${error.message}`);
    }
  },

  async sendWithAttachments({
    to,
    subject,
    html,
    text,
    attachments,
  }: SendEmailWithAttachmentsOptions) {
    const { error } = await getResend().emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content:
          typeof a.content === "string" ? Buffer.from(a.content) : a.content,
        contentType: a.contentType,
      })),
    });

    if (error) {
      throw new Error(`Resend: failed to send email: ${error.message}`);
    }
  },
};
