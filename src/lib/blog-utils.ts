import DOMPurify from "isomorphic-dompurify";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// ─── HTML Sanitization ───

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "ul", "ol", "li", "a",
  "strong", "em", "b", "i", "br", "blockquote",
  "code", "pre", "hr", "table", "thead", "tbody",
  "tr", "th", "td", "span", "div", "sup", "sub",
];

const ALLOWED_ATTR = ["href", "rel", "target", "id", "class"];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

// ─── Slug Sanitization ───

export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── JSON-LD Safe Serialization ───

export function safeJsonLdStringify(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/<\//g, "<\\/");
}

// ─── API Key Encryption (AES-256-GCM with NEXTAUTH_SECRET) ───

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  // Derive a 32-byte key from the secret
  const { createHash } = require("crypto") as typeof import("crypto");
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptApiKey(stored: string): string {
  if (!stored || !stored.includes(":")) return stored; // Return as-is for empty or legacy plaintext
  const parts = stored.split(":");
  if (parts.length !== 3) return ""; // Invalid format
  const [ivB64, tagB64, ciphertextB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ─── API Key Masking ───

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

// ─── URL Validation (SSRF Prevention) ───

export function validateOllamaUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "URL must use http or https protocol" };
    }
    const hostname = parsed.hostname.toLowerCase();
    const blocked = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.169.254", // Cloud metadata
      "[::1]",
    ];
    if (blocked.includes(hostname)) {
      return { valid: false, error: "Internal/localhost URLs are not allowed" };
    }
    if (
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return { valid: false, error: "Private network URLs are not allowed" };
    }
    // Check 172.16.0.0/12 range
    if (hostname.startsWith("172.")) {
      const second = parseInt(hostname.split(".")[1], 10);
      if (second >= 16 && second <= 31) {
        return { valid: false, error: "Private network URLs are not allowed" };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// ─── Content Size Validation ───

const MAX_CONTENT_SIZE = 100_000; // 100KB

export function validateContentSize(contentHtml: string): { valid: boolean; error?: string } {
  if (contentHtml && contentHtml.length > MAX_CONTENT_SIZE) {
    return { valid: false, error: `Content is too large (max ${MAX_CONTENT_SIZE / 1000}KB)` };
  }
  return { valid: true };
}
