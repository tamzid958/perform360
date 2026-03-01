import nodemailer from "nodemailer";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";
import { prisma } from "@/lib/prisma";

// ─── SMTP Config Types ───

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

interface SmtpCacheEntry {
  config: SmtpConfig | null;
  expiry: number;
}

const SMTP_CACHE = new Map<string, SmtpCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const SMTP_PASSWORD_MASK = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";

// ─── SMTP Password Encryption ───

function getSmtpEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret)
    throw new Error("NEXTAUTH_SECRET is required for SMTP password encryption");
  return createHash("sha256").update(secret).digest();
}

export function encryptSmtpPassword(plaintext: string): string {
  const key = getSmtpEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptSmtpPassword(encryptedBase64: string): string {
  const key = getSmtpEncryptionKey();
  const data = Buffer.from(encryptedBase64, "base64");
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}

// ─── SMTP Config Resolution ───

function getEnvSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from: process.env.SMTP_FROM || "noreply@perform360.com",
  };
}

async function resolveSmtpConfig(companyId?: string): Promise<SmtpConfig> {
  if (!companyId) return getEnvSmtpConfig();

  const cached = SMTP_CACHE.get(companyId);
  if (cached && cached.expiry > Date.now()) {
    return cached.config ?? getEnvSmtpConfig();
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true },
  });

  const settings = company?.settings as {
    smtp?: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    };
  } | null;

  if (!settings?.smtp?.host) {
    SMTP_CACHE.set(companyId, { config: null, expiry: Date.now() + CACHE_TTL_MS });
    return getEnvSmtpConfig();
  }

  const config: SmtpConfig = {
    host: settings.smtp.host,
    port: settings.smtp.port,
    user: settings.smtp.user,
    password: decryptSmtpPassword(settings.smtp.password),
    from: settings.smtp.from,
  };

  SMTP_CACHE.set(companyId, { config, expiry: Date.now() + CACHE_TTL_MS });
  return config;
}

function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
  });
}

export function invalidateSmtpConfigCache(companyId: string): void {
  SMTP_CACHE.delete(companyId);
}

// ─── Send Email ───

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  companyId?: string;
}

interface SendEmailWithAttachmentsOptions extends SendEmailOptions {
  attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  companyId,
}: SendEmailOptions) {
  const config = await resolveSmtpConfig(companyId);
  const transporter = createTransporter(config);
  await transporter.sendMail({
    from: `Perform360 <${config.from}>`,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}

export async function sendEmailWithAttachments({
  to,
  subject,
  html,
  text,
  companyId,
  attachments,
}: SendEmailWithAttachmentsOptions) {
  const config = await resolveSmtpConfig(companyId);
  const transporter = createTransporter(config);
  await transporter.sendMail({
    from: `Perform360 <${config.from}>`,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
    attachments,
  });
}

// ─── Helpers ───

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailWrapper(subtitle: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <tr>
                <td>
                  <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1d1d1f;">Perform360</h1>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #86868b;">${subtitle}</p>
                  ${bodyContent}
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1a6; text-align: center;">Perform360 &mdash; 360&deg; Performance Evaluation</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display: inline-block; background: #0071e3; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 15px; font-weight: 500;">${escapeHtml(label)}</a>`;
}

// ─── Magic Link Login ───

export function getMagicLinkEmail(url: string): { html: string; text: string } {
  const html = emailWrapper(
    "Sign In",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">Click the button below to sign in to your Perform360 account. This link expires in 24 hours.</p>
    ${ctaButton(url, "Sign In to Perform360")}
    <p style="margin: 24px 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">If you didn't request this email, you can safely ignore it.</p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4; word-break: break-all;">Or copy this link: ${escapeHtml(url)}</p>
    `
  );

  const text = `Sign in to Perform360\n\nClick the link below to sign in:\n${url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`;

  return { html, text };
}

// ─── OTP Verification ───

export function getOTPEmail(otp: string, recipientName: string): { html: string; text: string } {
  const html = emailWrapper(
    "Verification Code",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">Use the following code to verify your identity and access the evaluation form:</p>
    <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f; font-family: 'SF Mono', monospace;">${escapeHtml(otp)}</span>
    </div>
    <p style="margin: 0 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">This code expires in 10 minutes.</p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">If you didn't request this code, please ignore this email.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

  return { html, text };
}

// ─── Evaluation Invitation ───

export function getEvaluationInviteEmail(
  recipientName: string,
  subjectName: string,
  cycleName: string,
  evaluationUrl: string
): { html: string; text: string } {
  const html = emailWrapper(
    "Evaluation Invitation",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">You've been invited to provide feedback for <strong>${escapeHtml(subjectName)}</strong> as part of the <strong>${escapeHtml(cycleName)}</strong> evaluation cycle.</p>
    ${ctaButton(evaluationUrl, "Start Evaluation")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll be asked to verify your identity with a one-time code before starting.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nYou've been invited to provide feedback for ${subjectName} as part of the ${cycleName} evaluation cycle.\n\nStart your evaluation: ${evaluationUrl}\n\nYou'll be asked to verify your identity with a one-time code before starting.`;

  return { html, text };
}

// ─── Evaluation Reminder ───

export function getEvaluationReminderEmail(
  recipientName: string,
  subjectName: string,
  cycleName: string,
  deadline: string,
  evaluationUrl: string
): { html: string; text: string } {
  const html = emailWrapper(
    "Evaluation Reminder",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">This is a friendly reminder that your evaluation for <strong>${escapeHtml(subjectName)}</strong> as part of the <strong>${escapeHtml(cycleName)}</strong> cycle is still pending.</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">The deadline is <strong>${escapeHtml(deadline)}</strong>. Please complete it before then.</p>
    ${ctaButton(evaluationUrl, "Complete Evaluation")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll be asked to verify your identity with a one-time code before starting.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nThis is a friendly reminder that your evaluation for ${subjectName} as part of the ${cycleName} cycle is still pending.\n\nThe deadline is ${deadline}. Please complete it before then.\n\nComplete your evaluation: ${evaluationUrl}`;

  return { html, text };
}

// ─── Data Export Ready ───

export function getDataExportEmail(
  companyName: string,
  exportedAt: string
): { html: string; text: string } {
  const html = emailWrapper(
    "Data Export",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">Your data export for <strong>${escapeHtml(companyName)}</strong> is ready. The JSON file is attached to this email.</p>
    <p style="margin: 0 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">Exported on ${escapeHtml(exportedAt)}.</p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">This file contains decrypted evaluation responses. Please store it securely and delete it when no longer needed.</p>
    `
  );

  const text = `Hi,\n\nYour data export for ${companyName} is ready. The JSON file is attached to this email.\n\nExported on ${exportedAt}.\n\nThis file contains decrypted evaluation responses. Please store it securely and delete it when no longer needed.`;

  return { html, text };
}

// ─── User Invitation (Welcome) ───

export function getUserInviteEmail(
  recipientName: string,
  companyName: string,
  loginUrl: string
): { html: string; text: string } {
  const html = emailWrapper(
    "Welcome",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">You've been invited to join <strong>${escapeHtml(companyName)}</strong> on Perform360, a 360-degree performance evaluation platform.</p>
    ${ctaButton(loginUrl, "Sign In to Get Started")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll sign in using a magic link sent to your email — no password needed.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nYou've been invited to join ${companyName} on Perform360, a 360-degree performance evaluation platform.\n\nSign in to get started: ${loginUrl}\n\nYou'll sign in using a magic link sent to your email — no password needed.`;

  return { html, text };
}

// ─── Company Destroyed ───

export function getCompanyDestroyedEmail(
  companyName: string,
  destroyedAt: string,
  initiatedBy: string
): { html: string; text: string } {
  const html = emailWrapper(
    "Company Deleted",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">
      This email confirms that <strong>${escapeHtml(companyName)}</strong> and all associated data
      have been permanently deleted from Perform360.
    </p>
    <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">Deletion Details</p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #7f1d1d;">Company: ${escapeHtml(companyName)}</p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #7f1d1d;">Deleted on: ${escapeHtml(destroyedAt)}</p>
      <p style="margin: 0; font-size: 13px; color: #7f1d1d;">Initiated by: ${escapeHtml(initiatedBy)}</p>
    </div>
    <p style="margin: 0 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">
      This action is irreversible. All users, teams, evaluation cycles, responses, encryption keys,
      and audit logs have been permanently removed.
    </p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">
      If you did not initiate this action, please contact support immediately.
    </p>
    `
  );

  const text = `Hi,\n\nThis email confirms that ${companyName} and all associated data have been permanently deleted from Perform360.\n\nCompany: ${companyName}\nDeleted on: ${destroyedAt}\nInitiated by: ${initiatedBy}\n\nThis action is irreversible. All users, teams, evaluation cycles, responses, encryption keys, and audit logs have been permanently removed.\n\nIf you did not initiate this action, please contact support immediately.`;

  return { html, text };
}

