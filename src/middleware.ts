import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function middleware(request: NextRequest) {
  // Rate-limit magic link sends (POST to NextAuth signin)
  if (
    request.method === "POST" &&
    request.nextUrl.pathname.startsWith("/api/auth/signin")
  ) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`auth:signin:${ip}`, AUTH_RATE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/signin/:path*"],
};
