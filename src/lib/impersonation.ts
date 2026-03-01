import { cookies } from "next/headers";
import { prisma } from "./prisma";

const IMPERSONATION_COOKIE = "p360_impersonate";

interface ImpersonationPayload {
  superAdminId: string;
  superAdminEmail: string;
  companyId: string;
  adminUserId: string;
  expiresAt: string;
}

export interface ImpersonationResult {
  userId: string;
  email: string;
  role: "ADMIN";
  companyId: string;
  superAdminEmail: string;
}

/**
 * Read and validate the impersonation cookie.
 * Returns the impersonated admin's info if valid, null otherwise.
 * Automatically clears expired/invalid cookies.
 */
export async function getImpersonation(): Promise<ImpersonationResult | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;

  let payload: ImpersonationPayload;
  try {
    payload = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  if (
    !payload.superAdminId ||
    !payload.companyId ||
    !payload.adminUserId ||
    !payload.expiresAt
  ) {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  if (new Date(payload.expiresAt) < new Date()) {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  // Verify the super admin still exists
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: payload.superAdminId },
    select: { id: true },
  });

  if (!superAdmin) {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  // Fetch the impersonated admin user
  const admin = await prisma.user.findUnique({
    where: { id: payload.adminUserId },
    select: { id: true, email: true, role: true, companyId: true },
  });

  if (!admin || admin.companyId !== payload.companyId) {
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  return {
    userId: admin.id,
    email: admin.email,
    role: "ADMIN",
    companyId: admin.companyId,
    superAdminEmail: payload.superAdminEmail,
  };
}
