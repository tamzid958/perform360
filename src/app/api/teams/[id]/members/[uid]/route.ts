import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function DELETE(
  _request: NextRequest,
  { params: _params }: { params: { id: string; uid: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  return NextResponse.json({ success: true, data: { deleted: true } });
}
