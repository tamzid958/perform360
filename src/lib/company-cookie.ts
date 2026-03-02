import { cookies } from "next/headers";
import { isValidCuid } from "./validation";

const COOKIE_NAME = "p360_selected_company";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function getSelectedCompanyId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value ?? null;

  // Reject tampered values — must be a valid CUID format
  if (value && !isValidCuid(value)) {
    return null;
  }

  return value;
}

export async function setSelectedCompany(companyId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSelectedCompany(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
