import { NextRequest } from "next/server";
import { encrypt, decrypt, deriveKey } from "./encryption";

const COOKIE_NAME = "_enc_dk";
const COOKIE_MAX_AGE = 4 * 60 * 60; // 4 hours in seconds
const SESSION_KEY_SALT = "performs360-enc-session-key";

/**
 * Derive a stable session encryption key from NEXTAUTH_SECRET.
 * Used to encrypt/decrypt the company data key stored in the cookie.
 */
function getSessionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET not configured");
  }
  const salt = Buffer.alloc(32);
  Buffer.from(SESSION_KEY_SALT, "utf-8").copy(salt);
  return deriveKey(secret, salt);
}

/**
 * Encrypt a company data key for storage in an httpOnly cookie.
 */
export function encryptDataKeyForCookie(dataKey: Buffer): string {
  const sessionKey = getSessionKey();
  const { encrypted, iv, tag } = encrypt(dataKey.toString("base64"), sessionKey);
  return Buffer.from(JSON.stringify({ e: encrypted, i: iv, t: tag })).toString("base64");
}

/**
 * Decrypt a company data key from the cookie value.
 * Returns null if the cookie is invalid or tampered.
 */
export function decryptDataKeyFromCookie(cookieValue: string): Buffer | null {
  try {
    const parsed = JSON.parse(Buffer.from(cookieValue, "base64").toString("utf-8")) as {
      e: string;
      i: string;
      t: string;
    };
    const sessionKey = getSessionKey();
    const dataKeyBase64 = decrypt(parsed.e, parsed.i, parsed.t, sessionKey);
    return Buffer.from(dataKeyBase64, "base64");
  } catch {
    return null;
  }
}

/**
 * Read and decrypt the data key from the request's cookie.
 * Returns null if the cookie is missing or invalid.
 */
export function getDataKeyFromRequest(request: NextRequest): Buffer | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return decryptDataKeyFromCookie(cookie.value);
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
