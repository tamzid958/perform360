import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/** In-memory store keyed by identifier (IP, email, etc.) */
const store = new Map<string, RateLimitEntry>();

/** Cleanup stale entries every 5 minutes */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  store.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  });
}

/**
 * Check rate limit for a given identifier.
 * Returns { allowed: true, remaining } or { allowed: false, retryAfterSeconds }.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

/**
 * Returns a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

// ─── Preset configs ───

/** API calls: 100 per minute per IP */
export const API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000,
};

/** Auth actions (login): 5 per 15 minutes per IP */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
};

/** OTP sends: 5 per email per hour */
export const OTP_SEND_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
};

/** OTP verifications: 3 attempts per session (handled by OtpSession.attempts, not here) */

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Convenience: apply API rate limiting (100/min/IP).
 * Returns a 429 response if exceeded, null if allowed.
 */
export function applyRateLimit(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`api:${ip}`, API_RATE_LIMIT);
  if (!result.allowed) return rateLimitResponse(result.retryAfterSeconds);
  return null;
}
