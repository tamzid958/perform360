import { NextResponse } from "next/server";

/**
 * Validates that a string looks like a cuid (starts with 'c', 24-25 chars alphanumeric).
 */
const CUID_REGEX = /^c[a-z0-9]{20,28}$/;

export function isValidCuid(value: string): boolean {
  return CUID_REGEX.test(value);
}

/**
 * Returns a 400 response if the param is not a valid cuid.
 * Returns null if valid.
 */
export function validateCuidParam(
  value: string,
  paramName: string = "id"
): NextResponse | null {
  if (!isValidCuid(value)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid ${paramName} format`,
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }
  return null;
}
