import { sendEmail } from "@/lib/email";
import type { EmailSendPayload } from "@/types/job";

export async function handleEmailSend(payload: EmailSendPayload): Promise<void> {
  await sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    companyId: payload.companyId,
  });
}
