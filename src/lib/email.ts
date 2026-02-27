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
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const from = process.env.SMTP_FROM || "noreply@perform360.com";

  await transporter.sendMail({
    from: `Perform360 <${from}>`,
    to,
    subject,
    html,
  });
}

export function getOTPEmailHtml(otp: string, recipientName: string): string {
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
                  <p style="margin: 0 0 24px; font-size: 14px; color: #86868b;">Verification Code</p>
                  <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">Use the following code to verify your identity and access the evaluation form:</p>
                  <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f; font-family: 'SF Mono', monospace;">${otp}</span>
                  </div>
                  <p style="margin: 0 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">This code expires in 10 minutes.</p>
                  <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">If you didn't request this code, please ignore this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getEvaluationReminderHtml(
  recipientName: string,
  subjectName: string,
  cycleName: string,
  deadline: string,
  evaluationUrl: string
): string {
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
                  <p style="margin: 0 0 24px; font-size: 14px; color: #86868b;">Evaluation Reminder</p>
                  <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
                  <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">This is a friendly reminder that your evaluation for <strong>${subjectName}</strong> as part of the <strong>${cycleName}</strong> cycle is still pending.</p>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">The deadline is <strong>${deadline}</strong>. Please complete it before then.</p>
                  <a href="${evaluationUrl}" style="display: inline-block; background: #0071e3; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 15px; font-weight: 500;">Complete Evaluation</a>
                  <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll be asked to verify your identity with a one-time code before starting.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getEvaluationInviteHtml(
  recipientName: string,
  subjectName: string,
  cycleName: string,
  evaluationUrl: string
): string {
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
                  <p style="margin: 0 0 24px; font-size: 14px; color: #86868b;">Evaluation Invitation</p>
                  <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${recipientName},</p>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">You've been invited to provide feedback for <strong>${subjectName}</strong> as part of the <strong>${cycleName}</strong> evaluation cycle.</p>
                  <a href="${evaluationUrl}" style="display: inline-block; background: #0071e3; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 15px; font-weight: 500;">Start Evaluation</a>
                  <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll be asked to verify your identity with a one-time code before starting.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
