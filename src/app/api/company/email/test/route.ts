import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";

const DEFAULT_TEST_FROM =
  process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";

const testResendSchema = z.object({
  apiKey: z.string().min(1),
  from: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const parsed = testResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { apiKey, from } = parsed.data;
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: from || DEFAULT_TEST_FROM,
      to: authResult.email,
      subject: "Performs360 Email Test",
      html: "<p>Your Resend configuration is working correctly.</p>",
      text: "Your Resend configuration is working correctly.",
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { sentTo: authResult.email },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 400 }
    );
  }
}
