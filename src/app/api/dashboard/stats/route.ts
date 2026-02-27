import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  return NextResponse.json({
    success: true,
    data: {
      activeCycles: 2,
      totalTeams: 8,
      pendingReviews: 24,
      completionRate: 67,
    },
  });
}
