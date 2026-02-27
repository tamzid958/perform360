import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LENGTH);
}

export function generateDataKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

export function encryptDataKey(dataKey: Buffer, masterKey: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptDataKey(encryptedDataKey: string, masterKey: Buffer): Buffer {
  const data = Buffer.from(encryptedDataKey, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function encrypt(plaintext: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: authTag.toString("base64"),
  };
}

export function decrypt(encrypted: string, iv: string, tag: string, key: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateSalt(): string {
  return randomBytes(SALT_LENGTH).toString("base64");
}

// ─── Recovery Code Helpers ───

const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // Excludes ambiguous: 0/O, 1/I/L

export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(10);
    let code = "";
    for (let j = 0; j < 10; j++) {
      code += RECOVERY_ALPHABET[bytes[j] % RECOVERY_ALPHABET.length];
      if (j === 4) code += "-";
    }
    codes.push(code);
  }
  return codes;
}

function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/-/g, "").trim();
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(normalizeRecoveryCode(code), 10);
}

export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(normalizeRecoveryCode(code), hash);
}
