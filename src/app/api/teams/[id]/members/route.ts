import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: { teamId: params.id, ...body },
  }, { status: 201 });
}
