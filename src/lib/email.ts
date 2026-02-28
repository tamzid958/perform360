import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.SMTP_FROM || "noreply@perform360.com";

  await transporter.sendMail({
    from: `Perform360 <${from}>`,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}

// ─── Shared email wrapper ───

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
  return `<a href="${href}" style="display: inline-block; background: #0071e3; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 15px; font-weight: 500;">${label}</a>`;
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
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4; word-break: break-all;">Or copy this link: ${url}</p>
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
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">Use the following code to verify your identity and access the evaluation form:</p>
    <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f; font-family: 'SF Mono', monospace;">${otp}</span>
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
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">You've been invited to provide feedback for <strong>${subjectName}</strong> as part of the <strong>${cycleName}</strong> evaluation cycle.</p>
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
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">This is a friendly reminder that your evaluation for <strong>${subjectName}</strong> as part of the <strong>${cycleName}</strong> cycle is still pending.</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">The deadline is <strong>${deadline}</strong>. Please complete it before then.</p>
    ${ctaButton(evaluationUrl, "Complete Evaluation")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll be asked to verify your identity with a one-time code before starting.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nThis is a friendly reminder that your evaluation for ${subjectName} as part of the ${cycleName} cycle is still pending.\n\nThe deadline is ${deadline}. Please complete it before then.\n\nComplete your evaluation: ${evaluationUrl}`;

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
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">You've been invited to join <strong>${companyName}</strong> on Perform360, a 360-degree performance evaluation platform.</p>
    ${ctaButton(loginUrl, "Sign In to Get Started")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll sign in using a magic link sent to your email — no password needed.</p>
    `
  );

  const text = `Hi ${recipientName},\n\nYou've been invited to join ${companyName} on Perform360, a 360-degree performance evaluation platform.\n\nSign in to get started: ${loginUrl}\n\nYou'll sign in using a magic link sent to your email — no password needed.`;

  return { html, text };
}

// ─── Backward-compatible aliases (deprecated — use the new *Email functions) ───

export function getOTPEmailHtml(otp: string, recipientName: string): string {
  return getOTPEmail(otp, recipientName).html;
}

export function getEvaluationReminderHtml(
  recipientName: string,
  subjectName: string,
  cycleName: string,
  deadline: string,
  evaluationUrl: string
): string {
  return getEvaluationReminderEmail(recipientName, subjectName, cycleName, deadline, evaluationUrl).html;
}

export function getEvaluationInviteHtml(
  recipientName: string,
  subjectName: string,
  cycleName: string,
  evaluationUrl: string
): string {
  return getEvaluationInviteEmail(recipientName, subjectName, cycleName, evaluationUrl).html;
}
