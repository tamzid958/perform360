import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";

export interface SuperAdminAuth {
  id: string;
  email: string;
}

type RouteHandler<TParams = Record<string, string>> = (
  request: NextRequest,
  context: { params: TParams; auth: SuperAdminAuth }
) => Promise<NextResponse>;

/**
 * Wraps a route handler to enforce Super Admin authentication.
 * Checks the SuperAdmin table (separate from company User table).
 * Applies API rate limiting.
 */
export function withSuperAdmin<TParams extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<TParams>
): (request: NextRequest, context: { params: Promise<TParams> }) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: Promise<TParams> }) => {
    const rateLimited = applyRateLimit(request);
    if (rateLimited) return rateLimited;

    const authResult = await requireSuperAdmin();
    if (isAuthError(authResult)) return authResult;

    const params = await context.params;
    return handler(request, {
      params,
      auth: authResult,
    });
  };
}
