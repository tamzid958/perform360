import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function POST(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  // In production: send reminder emails to pending reviewers
  return NextResponse.json({
    success: true,
    data: { sent: 0 },
  });
}
