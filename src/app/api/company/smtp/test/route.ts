import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";

const testSmtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string().min(1),
  from: z.string().email(),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = testSmtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { host, port, user, password, from } = parsed.data;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: `Perform360 <${from}>`,
      to: authResult.email,
      subject: "Perform360 SMTP Test",
      html: "<p>Your SMTP configuration is working correctly.</p>",
      text: "Your SMTP configuration is working correctly.",
    });

    return NextResponse.json({
      success: true,
      data: { sentTo: authResult.email },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "SMTP connection failed",
      },
      { status: 400 }
    );
  }
}
