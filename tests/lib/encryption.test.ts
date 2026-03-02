import { describe, it, expect } from "vitest";
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

describe("encryption", () => {
  describe("deriveKey", () => {
    it("derives a 32-byte key from passphrase and salt", () => {
      const salt = Buffer.from(generateSalt(), "base64");
      const key = deriveKey("test-passphrase", salt);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it("produces deterministic output for same inputs", () => {
      const salt = Buffer.from(generateSalt(), "base64");
      const key1 = deriveKey("same-passphrase", salt);
      const key2 = deriveKey("same-passphrase", salt);
      expect(key1.equals(key2)).toBe(true);
    });

    it("produces different output for different passphrases", () => {
      const salt = Buffer.from(generateSalt(), "base64");
      const key1 = deriveKey("passphrase-a", salt);
      const key2 = deriveKey("passphrase-b", salt);
      expect(key1.equals(key2)).toBe(false);
    });

    it("produces different output for different salts", () => {
      const salt1 = Buffer.from(generateSalt(), "base64");
      const salt2 = Buffer.from(generateSalt(), "base64");
      const key1 = deriveKey("same-passphrase", salt1);
      const key2 = deriveKey("same-passphrase", salt2);
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe("generateDataKey", () => {
    it("generates a 32-byte random data key", () => {
      const key = generateDataKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it("generates unique keys each time", () => {
      const key1 = generateDataKey();
      const key2 = generateDataKey();
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe("encryptDataKey / decryptDataKey", () => {
    it("round-trips a data key through encrypt/decrypt", () => {
      const masterKey = generateDataKey();
      const dataKey = generateDataKey();
      const encrypted = encryptDataKey(dataKey, masterKey);
      const decrypted = decryptDataKey(encrypted, masterKey);
      expect(decrypted.equals(dataKey)).toBe(true);
    });

    it("produces base64 encoded output", () => {
      const masterKey = generateDataKey();
      const dataKey = generateDataKey();
      const encrypted = encryptDataKey(dataKey, masterKey);
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    });

    it("fails to decrypt with wrong key", () => {
      const masterKey1 = generateDataKey();
      const masterKey2 = generateDataKey();
      const dataKey = generateDataKey();
      const encrypted = encryptDataKey(dataKey, masterKey1);
      expect(() => decryptDataKey(encrypted, masterKey2)).toThrow();
    });
  });

  describe("encrypt / decrypt", () => {
    it("round-trips plaintext through encrypt/decrypt", () => {
      const key = generateDataKey();
      const plaintext = "Hello, Perform360!";
      const { encrypted, iv, tag } = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, iv, tag, key);
      expect(decrypted).toBe(plaintext);
    });

    it("handles unicode content", () => {
      const key = generateDataKey();
      const plaintext = "日本語テスト 🎉";
      const { encrypted, iv, tag } = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, iv, tag, key);
      expect(decrypted).toBe(plaintext);
    });

    it("handles empty string", () => {
      const key = generateDataKey();
      const { encrypted, iv, tag } = encrypt("", key);
      const decrypted = decrypt(encrypted, iv, tag, key);
      expect(decrypted).toBe("");
    });

    it("produces different ciphertext for same plaintext (random IV)", () => {
      const key = generateDataKey();
      const result1 = encrypt("same text", key);
      const result2 = encrypt("same text", key);
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it("fails to decrypt with wrong key", () => {
      const key1 = generateDataKey();
      const key2 = generateDataKey();
      const { encrypted, iv, tag } = encrypt("secret", key1);
      expect(() => decrypt(encrypted, iv, tag, key2)).toThrow();
    });

    it("fails to decrypt with tampered tag", () => {
      const key = generateDataKey();
      const { encrypted, iv } = encrypt("secret", key);
      const fakeTag = Buffer.alloc(16, 0).toString("base64");
      expect(() => decrypt(encrypted, iv, fakeTag, key)).toThrow();
    });
  });

  describe("generateSalt", () => {
    it("generates a base64 encoded salt", () => {
      const salt = generateSalt();
      expect(typeof salt).toBe("string");
      const decoded = Buffer.from(salt, "base64");
      expect(decoded.length).toBe(32);
    });

    it("generates unique salts", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe("generateRecoveryCodes", () => {
    it("generates the specified number of codes", () => {
      const codes = generateRecoveryCodes(8);
      expect(codes).toHaveLength(8);
    });

    it("generates codes in XXXXX-XXXXX format", () => {
      const codes = generateRecoveryCodes(4);
      for (const code of codes) {
        expect(code).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
      }
    });

    it("excludes ambiguous characters (0, O, 1, I, L)", () => {
      const codes = generateRecoveryCodes(20);
      const allChars = codes.join("").replace(/-/g, "");
      expect(allChars).not.toMatch(/[01OIL]/);
    });

    it("defaults to 8 codes", () => {
      const codes = generateRecoveryCodes();
      expect(codes).toHaveLength(8);
    });
  });

  describe("hashRecoveryCode / verifyRecoveryCode", () => {
    it("verifies a valid recovery code", async () => {
      const code = "ABCDE-FGHJK";
      const hash = await hashRecoveryCode(code);
      const valid = await verifyRecoveryCode(code, hash);
      expect(valid).toBe(true);
    });

    it("rejects an invalid recovery code", async () => {
      const code = "ABCDE-FGHJK";
      const hash = await hashRecoveryCode(code);
      const valid = await verifyRecoveryCode("WRONG-CODES", hash);
      expect(valid).toBe(false);
    });

    it("normalizes case and dashes", async () => {
      const code = "ABCDE-FGHJK";
      const hash = await hashRecoveryCode(code);
      const valid = await verifyRecoveryCode("abcde-fghjk", hash);
      expect(valid).toBe(true);
    });

    it("verifies code without dashes", async () => {
      const code = "ABCDE-FGHJK";
      const hash = await hashRecoveryCode(code);
      const valid = await verifyRecoveryCode("ABCDEFGHJK", hash);
      expect(valid).toBe(true);
    });
  });
});
