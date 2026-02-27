import { NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireSuperAdmin();
  if (isAuthError(authResult)) return authResult;

  return NextResponse.json({
    success: true,
    data: {
      totalCompanies: 42,
      totalUsers: 1248,
      activeCycles: 18,
      monthlyRevenue: 12450,
    },
  });
}
