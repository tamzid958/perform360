import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  // In production: activate cycle, generate tokens, send emails
  return NextResponse.json({
    success: true,
    data: { id: params.id, status: "ACTIVE" },
  });
}
