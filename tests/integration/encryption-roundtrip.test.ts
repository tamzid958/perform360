import { describe, it, expect, vi } from "vitest";
import {
  deriveKey,
  generateDataKey,
  encryptDataKey,
  decryptDataKey,
  encrypt,
  decrypt,
  generateSalt,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "@/lib/encryption";

// Use real encryption-session functions (not the global mock)
vi.unmock("@/lib/encryption-session");
const { encryptDataKeyForCookie, decryptDataKeyFromCookie } = await import(
  "@/lib/encryption-session"
);

/**
 * Integration-style tests that exercise the full encryption pipeline
 * without mocking crypto internals — exactly as the production code
 * chains these operations together.
 */
describe("Integration: Encryption Round-Trip", () => {
  // ─── Master-key → data-key pipeline ───
  describe("Master key → Data key lifecycle", () => {
    it("derives a master key, wraps/unwraps a data key", () => {
      const passphrase = "company-master-secret";
      const salt = Buffer.alloc(32, "s");

      const masterKey = deriveKey(passphrase, salt);
      expect(masterKey).toBeInstanceOf(Buffer);
      expect(masterKey.length).toBe(32);

      const dataKey = generateDataKey();
      expect(dataKey.length).toBe(32);

      const wrapped = encryptDataKey(dataKey, masterKey);
      const unwrapped = decryptDataKey(wrapped, masterKey);

      expect(unwrapped).toEqual(dataKey);
    });

    it("rejects wrong master key for unwrap", () => {
      const salt = Buffer.alloc(32, "x");
      const correctKey = deriveKey("correct", salt);
      const wrongKey = deriveKey("wrong", salt);

      const dataKey = generateDataKey();
      const wrapped = encryptDataKey(dataKey, correctKey);

      expect(() => decryptDataKey(wrapped, wrongKey)).toThrow();
    });
  });

  // ─── Data-key → plaintext encryption ───
  describe("Data key → Encrypt / Decrypt plaintext", () => {
    it("encrypts and decrypts evaluation answers JSON", () => {
      const dataKey = generateDataKey();
      const answers = JSON.stringify({ q1: 5, q2: "Excellent leadership" });

      const { encrypted, iv, tag } = encrypt(answers, dataKey);
      const decrypted = decrypt(encrypted, iv, tag, dataKey);

      expect(decrypted).toBe(answers);
      expect(JSON.parse(decrypted)).toEqual({ q1: 5, q2: "Excellent leadership" });
    });

    it("each encryption produces unique ciphertext (random IV)", () => {
      const dataKey = generateDataKey();
      const text = "same input";

      const a = encrypt(text, dataKey);
      const b = encrypt(text, dataKey);

      expect(a.iv).not.toBe(b.iv);
      expect(a.encrypted).not.toBe(b.encrypted);

      // Both decrypt to original
      expect(decrypt(a.encrypted, a.iv, a.tag, dataKey)).toBe(text);
      expect(decrypt(b.encrypted, b.iv, b.tag, dataKey)).toBe(text);
    });

    it("detects tampered ciphertext", () => {
      const dataKey = generateDataKey();
      const { encrypted, iv, tag } = encrypt("secret", dataKey);

      // Flip a character in the ciphertext
      const tampered =
        encrypted[0] === "A"
          ? "B" + encrypted.slice(1)
          : "A" + encrypted.slice(1);

      expect(() => decrypt(tampered, iv, tag, dataKey)).toThrow();
    });

    it("handles unicode and emoji", () => {
      const dataKey = generateDataKey();
      const text = "日本語テスト 🔐 中文测试";

      const { encrypted, iv, tag } = encrypt(text, dataKey);
      expect(decrypt(encrypted, iv, tag, dataKey)).toBe(text);
    });
  });

  // ─── Full pipeline: passphrase → master → data key → ciphertext ───
  describe("End-to-end: passphrase to ciphertext and back", () => {
    it("full company encryption lifecycle", () => {
      // 1. Company setup: admin provides passphrase, derive master key
      const passphrase = "my-company-secret-2026";
      const salt = Buffer.alloc(32);
      Buffer.from(generateSalt(), "base64").copy(salt);
      const masterKey = deriveKey(passphrase, salt);

      // 2. Generate data key and wrap it for storage
      const dataKey = generateDataKey();
      const wrappedDataKey = encryptDataKey(dataKey, masterKey);

      // 3. Encrypt evaluation answers with data key
      const answers = { q1: 4, q2: "Needs improvement", q3: true };
      const answersJson = JSON.stringify(answers);
      const { encrypted, iv, tag } = encrypt(answersJson, dataKey);

      // 4. Later: unwrap data key and decrypt answers
      const recoveredDataKey = decryptDataKey(wrappedDataKey, masterKey);
      const recoveredJson = decrypt(encrypted, iv, tag, recoveredDataKey);

      expect(JSON.parse(recoveredJson)).toEqual(answers);
    });
  });

  // ─── Cookie session encryption (encryption-session.ts) ───
  describe("Cookie session data-key encryption", () => {
    it("round-trips data key through cookie encryption", () => {
      // NOTE: encryptDataKeyForCookie / decryptDataKeyFromCookie depend on
      // NEXTAUTH_SECRET env var, so we set it for this test.
      const original = process.env.NEXTAUTH_SECRET;
      process.env.NEXTAUTH_SECRET = "test-secret-for-cookie-encryption";

      try {
        const dataKey = generateDataKey();
        const cookieValue = encryptDataKeyForCookie(dataKey);
        const recovered = decryptDataKeyFromCookie(cookieValue);

        expect(recovered).toEqual(dataKey);
      } finally {
        process.env.NEXTAUTH_SECRET = original;
      }
    });

    it("returns null for tampered cookie value", () => {
      const original = process.env.NEXTAUTH_SECRET;
      process.env.NEXTAUTH_SECRET = "test-secret-for-cookie-encryption";

      try {
        const result = decryptDataKeyFromCookie("dGFtcGVyZWQ="); // base64 "tampered"
        expect(result).toBeNull();
      } finally {
        process.env.NEXTAUTH_SECRET = original;
      }
    });
  });

  // ─── Recovery codes ───
  describe("Recovery code lifecycle", () => {
    it("generates, hashes, and verifies recovery codes", async () => {
      const codes = generateRecoveryCodes(3);
      expect(codes).toHaveLength(3);

      // Each code should be verifiable against its hash
      for (const code of codes) {
        const hash = await hashRecoveryCode(code);
        expect(await verifyRecoveryCode(code, hash)).toBe(true);
      }
    });

    it("verifies with case-insensitive + dash-stripped input", async () => {
      const codes = generateRecoveryCodes(1);
      const code = codes[0]; // e.g. "ABCDE-FGHIJ"
      const hash = await hashRecoveryCode(code);

      // Lowercase with dash
      expect(await verifyRecoveryCode(code.toLowerCase(), hash)).toBe(true);

      // Without dash
      expect(await verifyRecoveryCode(code.replace("-", ""), hash)).toBe(true);
    });

    it("rejects wrong recovery code", async () => {
      const [codeA, codeB] = generateRecoveryCodes(2);
      const hashA = await hashRecoveryCode(codeA);

      expect(await verifyRecoveryCode(codeB, hashA)).toBe(false);
    });
  });
});
