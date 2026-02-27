import { NextResponse } from "next/server";
import { requireAdminOrHR, isAuthError } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  return NextResponse.json({
    success: true,
    data: [],
  });
}
