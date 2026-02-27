import { getEmailProvider } from "./factory";
import type {
  SendEmailOptions,
  SendEmailWithAttachmentsOptions,
} from "./types";

// ─── Public API (unchanged from original email.ts) ───

export async function sendEmail(options: SendEmailOptions) {
  await getEmailProvider().send(options);
}

export async function sendEmailWithAttachments(
  options: SendEmailWithAttachmentsOptions
) {
  await getEmailProvider().sendWithAttachments(options);
}

// ─── Re-export templates ───

export {
  getMagicLinkEmail,
  getOTPEmail,
  getEvaluationInviteEmail,
  getEvaluationReminderEmail,
  getSummaryInviteEmail,
  getSummaryReminderEmail,
  getDataExportEmail,
  getUserInviteEmail,
  getCycleCompletionEmail,
  getReportsExportEmail,
  getReportsExportExcelEmail,
} from "./templates";

// ─── Re-export types ───

export type {
  EmailProvider,
  SendEmailOptions,
  SendEmailWithAttachmentsOptions,
} from "./types";
