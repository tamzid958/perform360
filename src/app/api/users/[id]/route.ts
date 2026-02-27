import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: { id: params.id, ...body },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  return NextResponse.json({ success: true, data: { deactivated: true } });
}
