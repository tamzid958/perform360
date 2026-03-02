import { NextResponse } from "next/server";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { getImpersonation } from "./impersonation";

type UserRole = "ADMIN" | "HR" | "EMPLOYEE";

interface AuthResult {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}

/**
 * Require authenticated session and return user info.
 * Scopes User lookup by companyId from session to prevent cross-company leaks.
 * Returns NextResponse error if unauthenticated.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check for super-admin impersonation session
  const impersonation = await getImpersonation();
  if (impersonation) {
    return {
      userId: impersonation.userId,
      email: impersonation.email,
      role: impersonation.role,
      companyId: impersonation.companyId,
    };
  }

  // Scope by companyId from session to handle same email in multiple companies
  const whereClause = session.user.companyId
    ? { email: session.user.email, companyId: session.user.companyId, archivedAt: null }
    : { email: session.user.email, archivedAt: null };

  const user = await prisma.user.findFirst({
    where: whereClause,
    select: { id: true, email: true, role: true, companyId: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 401 }
    );
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };
}

/**
 * Require specific roles. Returns NextResponse error if role doesn't match.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth();

  if (result instanceof NextResponse) return result;

  if (!allowedRoles.includes(result.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Require ADMIN or HR role.
 */
export async function requireAdminOrHR(): Promise<AuthResult | NextResponse> {
  return requireRole("ADMIN", "HR");
}

/**
 * Require Super Admin (stored in SuperAdmin table, not User table).
 */
export async function requireSuperAdmin(): Promise<
  { id: string; email: string } | NextResponse
> {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!superAdmin) {
    return NextResponse.json(
      { success: false, error: "Forbidden — Super Admin only" },
      { status: 403 }
    );
  }

  return superAdmin;
}

/**
 * Type guard to check if auth result is an error response.
 */
export function isAuthError(
  result: AuthResult | NextResponse | { id: string; email: string }
): result is NextResponse {
  return result instanceof NextResponse;
}
