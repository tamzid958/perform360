import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}
