// ─── Email Option Types ───

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailWithAttachmentsOptions extends SendEmailOptions {
  attachments: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}

// ─── Provider Interface ───

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
  sendWithAttachments(options: SendEmailWithAttachmentsOptions): Promise<void>;
}
