import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireSuperAdmin();
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: { id: params.id, ...body },
  });
}
