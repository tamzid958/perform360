import bcryptjs from "bcryptjs";
import { generateOTP } from "./tokens";
import { OTP_CONFIG } from "./constants";

export async function hashOTP(otp: string): Promise<string> {
  return bcryptjs.hash(otp, 10);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(otp, hash);
}

export function createOTP(): { otp: string; expiresAt: Date } {
  const otp = generateOTP(OTP_CONFIG.length);
  const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);
  return { otp, expiresAt };
}

export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function isInCooldown(cooldownUntil: Date | null): boolean {
  if (!cooldownUntil) return false;
  return new Date() < cooldownUntil;
}

export function getCooldownEnd(): Date {
  return new Date(Date.now() + OTP_CONFIG.cooldownMinutes * 60 * 1000);
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + OTP_CONFIG.sessionDurationHours * 60 * 60 * 1000);
}

export function getSummarySessionExpiry(): Date {
  return new Date(Date.now() + OTP_CONFIG.summarySessionDurationHours * 60 * 60 * 1000);
}
