import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, API_RATE_LIMIT, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`api:${ip}`, API_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const action = searchParams.get("action") ?? undefined;

  const where: Record<string, unknown> = { companyId: authResult.companyId };
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        action: true,
        target: true,
        metadata: true,
        ip: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
