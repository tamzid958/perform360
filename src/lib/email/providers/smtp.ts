import nodemailer from "nodemailer";
import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailWithAttachmentsOptions,
} from "../types";

const DEFAULT_FROM =
  process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";

let _transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter {
  if (!_transport) {
    if (!process.env.SMTP_HOST) {
      throw new Error("SMTP_HOST env var is required for smtp provider");
    }
    const hasAuth = process.env.SMTP_USER && process.env.SMTP_PASS;
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      ...(hasAuth
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {}),
    });
  }
  return _transport;
}

export const smtpProvider: EmailProvider = {
  async send({ to, subject, html, text }: SendEmailOptions) {
    await getTransport().sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
  },

  async sendWithAttachments({
    to,
    subject,
    html,
    text,
    attachments,
  }: SendEmailWithAttachmentsOptions) {
    await getTransport().sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content:
          typeof a.content === "string"
            ? Buffer.from(a.content, "base64")
            : a.content,
        contentType: a.contentType,
      })),
    });
  },
};
