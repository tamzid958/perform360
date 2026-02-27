import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireSuperAdmin();
  if (isAuthError(authResult)) return authResult;

  return NextResponse.json({
    success: true,
    data: [],
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin();
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: { id: "new-company-id", ...body },
  }, { status: 201 });
}
