import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdminOrHR, isAuthError } from "@/lib/api-auth";

const createCycleSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

export async function GET() {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;

  // In production: fetch from prisma with company scope
  return NextResponse.json({
    success: true,
    data: [],
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminOrHR();
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const validated = createCycleSchema.parse(body);

    // In production: create cycle with prisma
    return NextResponse.json({
      success: true,
      data: { id: "new-cycle-id", ...validated, status: "DRAFT" },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
