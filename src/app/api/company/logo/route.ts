import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get("logo");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "File must be PNG, JPEG, WebP, or SVG", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File must be under 1 MB", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const company = await prisma.company.update({
      where: { id: authResult.companyId },
      data: { logo: dataUrl },
      select: { id: true, name: true, slug: true, logo: true, settings: true },
    });

    return NextResponse.json({ success: true, data: company });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rl = applyRateLimit(request);
  if (rl) return rl;

  const authResult = await requireRole("ADMIN");
  if (isAuthError(authResult)) return authResult;

  try {
    const company = await prisma.company.update({
      where: { id: authResult.companyId },
      data: { logo: null },
      select: { id: true, name: true, slug: true, logo: true, settings: true },
    });

    return NextResponse.json({ success: true, data: company });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
