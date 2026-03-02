import { Resend } from "resend";
import nodemailer from "nodemailer";

// ─── Environment ───

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const DEFAULT_FROM =
  process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";

// ─── Resend client (production) ───

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ─── Nodemailer transport (development — Mailtrap) ───

let _transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transport;
}

// ─── Send Email ───

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
}: SendEmailOptions) {
  if (IS_PRODUCTION) {
    const { error } = await getResend().emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } else {
    await getTransport().sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
  }
}

export async function sendEmailWithAttachments({
  to,
  subject,
  html,
  text,
  attachments,
}: SendEmailWithAttachmentsOptions) {
  if (IS_PRODUCTION) {
    const { error } = await getResend().emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } else {
    await getTransport().sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
        contentType: a.contentType,
      })),
    });
  }
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
                  <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1d1d1f;">Performs360</h1>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #86868b;">${subtitle}</p>
                  ${bodyContent}
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1a6; text-align: center;">Performs360 &mdash; 360&deg; Performance Evaluation</p>
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
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">Click the button below to sign in to your Performs360 account. This link expires in 24 hours.</p>
    ${ctaButton(url, "Sign In to Performs360")}
    <p style="margin: 24px 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">If you didn't request this email, you can safely ignore it.</p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4; word-break: break-all;">Or copy this link: ${escapeHtml(url)}</p>
    `
  );

  const text = `Sign in to Performs360\n\nClick the link below to sign in:\n${url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`;

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

// ─── Summary Evaluation Invitation ───

export function getSummaryInviteEmail(
  recipientName: string,
  cycleName: string,
  assignments: Array<{ subjectName: string; relationship: string }>,
  summaryUrl: string
): { html: string; text: string } {
  const assignmentListHtml = assignments
    .map(
      (a) =>
        `<li style="margin: 4px 0; font-size: 14px; color: #48484a;"><strong>${escapeHtml(a.subjectName)}</strong> <span style="color: #86868b;">&middot; ${escapeHtml(a.relationship)}</span></li>`
    )
    .join("");

  const count = assignments.length;
  const html = emailWrapper(
    "Evaluation Invitation",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">You have <strong>${count}</strong> evaluation${count === 1 ? "" : "s"} to complete for the <strong>${escapeHtml(cycleName)}</strong> cycle:</p>
    <ul style="margin: 0 0 24px; padding-left: 20px;">${assignmentListHtml}</ul>
    ${ctaButton(summaryUrl, "View All Evaluations")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll verify your identity once, then have 4 hours to complete all evaluations.</p>
    `
  );

  const assignmentListText = assignments
    .map((a) => `  - ${a.subjectName} (${a.relationship})`)
    .join("\n");

  const text = `Hi ${recipientName},\n\nYou have ${count} evaluation${count === 1 ? "" : "s"} to complete for the ${cycleName} cycle:\n\n${assignmentListText}\n\nView all evaluations: ${summaryUrl}\n\nYou'll verify your identity once, then have 4 hours to complete all evaluations.`;

  return { html, text };
}

// ─── Summary Evaluation Reminder ───

export function getSummaryReminderEmail(
  recipientName: string,
  cycleName: string,
  deadline: string,
  assignments: Array<{ subjectName: string; relationship: string }>,
  summaryUrl: string
): { html: string; text: string } {
  const assignmentListHtml = assignments
    .map(
      (a) =>
        `<li style="margin: 4px 0; font-size: 14px; color: #48484a;"><strong>${escapeHtml(a.subjectName)}</strong> <span style="color: #86868b;">&middot; ${escapeHtml(a.relationship)}</span></li>`
    )
    .join("");

  const count = assignments.length;
  const html = emailWrapper(
    "Evaluation Reminder",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">You still have <strong>${count}</strong> pending evaluation${count === 1 ? "" : "s"} for the <strong>${escapeHtml(cycleName)}</strong> cycle:</p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">${assignmentListHtml}</ul>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">The deadline is <strong>${escapeHtml(deadline)}</strong>. Please complete them before then.</p>
    ${ctaButton(summaryUrl, "View All Evaluations")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll verify your identity once, then have 4 hours to complete all evaluations.</p>
    `
  );

  const assignmentListText = assignments
    .map((a) => `  - ${a.subjectName} (${a.relationship})`)
    .join("\n");

  const text = `Hi ${recipientName},\n\nYou still have ${count} pending evaluation${count === 1 ? "" : "s"} for the ${cycleName} cycle:\n\n${assignmentListText}\n\nThe deadline is ${deadline}. Please complete them before then.\n\nView all evaluations: ${summaryUrl}\n\nYou'll verify your identity once, then have 4 hours to complete all evaluations.`;

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
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">You've been invited to join <strong>${escapeHtml(companyName)}</strong> on Performs360, a 360-degree performance evaluation platform.</p>
    ${ctaButton(loginUrl, "Sign In to Get Started")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll sign in using a magic link sent to your email — no password needed.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nYou've been invited to join ${companyName} on Performs360, a 360-degree performance evaluation platform.\n\nSign in to get started: ${loginUrl}\n\nYou'll sign in using a magic link sent to your email — no password needed.`;

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
      have been permanently deleted from Performs360.
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

  const text = `Hi,\n\nThis email confirms that ${companyName} and all associated data have been permanently deleted from Performs360.\n\nCompany: ${companyName}\nDeleted on: ${destroyedAt}\nInitiated by: ${initiatedBy}\n\nThis action is irreversible. All users, teams, evaluation cycles, responses, encryption keys, and audit logs have been permanently removed.\n\nIf you did not initiate this action, please contact support immediately.`;

  return { html, text };
}
