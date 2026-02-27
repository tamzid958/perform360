import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  // In production: generate PDF and return
  return NextResponse.json({
    success: true,
    data: { message: "PDF export not yet implemented" },
  });
}
