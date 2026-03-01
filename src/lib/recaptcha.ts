import { NextResponse } from "next/server";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const SCORE_THRESHOLD = 0.5;

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

async function verifyRecaptcha(token: string): Promise<RecaptchaResponse> {
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY!,
      response: token,
    }),
  });
  return res.json() as Promise<RecaptchaResponse>;
}

export async function requireRecaptcha(
  token: string | null | undefined
): Promise<NextResponse | null> {
  if (!RECAPTCHA_SECRET_KEY) return null;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "reCAPTCHA verification required" },
      { status: 400 }
    );
  }

  const result = await verifyRecaptcha(token);

  if (!result.success || (result.score !== undefined && result.score < SCORE_THRESHOLD)) {
    return NextResponse.json(
      { success: false, error: "reCAPTCHA verification failed" },
      { status: 403 }
    );
  }

  return null;
}
