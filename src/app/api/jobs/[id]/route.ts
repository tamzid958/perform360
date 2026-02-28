import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { getJobStatus } from "@/lib/queue";
import { validateCuidParam } from "@/lib/validation";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const invalid = validateCuidParam(params.id);
  if (invalid) return invalid;

  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  const job = await getJobStatus(params.id);

  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: job });
}
