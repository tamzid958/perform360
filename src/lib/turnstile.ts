import { NextResponse } from "next/server";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | null | undefined
): Promise<{ success: true } | { success: false; error: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("[Turnstile] TURNSTILE_SECRET_KEY not set, skipping verification");
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Bot verification required." };
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });

    const data: TurnstileVerifyResponse = await res.json();

    if (!data.success) {
      console.warn(
        `[Turnstile] Verification failed: ${data["error-codes"]?.join(", ") ?? "unknown"}`
      );
      return { success: false, error: "Bot verification failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("[Turnstile] Verification request failed:", error);
    return { success: true };
  }
}

export async function requireTurnstile(
  token: string | null | undefined
): Promise<NextResponse | null> {
  const result = await verifyTurnstileToken(token);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, code: "TURNSTILE_FAILED" },
      { status: 403 }
    );
  }
  return null;
}
