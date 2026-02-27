import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireSuperAdmin();
  if (isAuthError(authResult)) return authResult;

  // In production: create impersonation session, log audit trail
  return NextResponse.json({
    success: true,
    data: { companyId: params.id, impersonating: true },
  });
}
