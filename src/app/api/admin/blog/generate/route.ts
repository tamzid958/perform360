import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { enqueue } from "@/lib/queue";
import { JOB_TYPES } from "@/types/job";
import { BLOG_CONFIG } from "@/lib/constants";

/**
 * POST /api/admin/blog/generate — Manually trigger article generation.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(
    10,
    Math.max(1, body.count ?? BLOG_CONFIG.dailyArticleCount)
  );

  const jobId = await enqueue(JOB_TYPES.BLOG_GENERATE, { count }, { maxAttempts: 1 });

  return NextResponse.json({
    success: true,
    data: { jobId, count },
  });
}
