import { NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/middleware/super-admin";
import { prisma } from "@/lib/prisma";
import { validateCuidParam } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { cookies } from "next/headers";

type Params = { id: string };

const IMPERSONATION_COOKIE = "p360_impersonate";
const IMPERSONATION_TTL_HOURS = 1;

export const POST = withSuperAdmin<Params>(async (request, { params, auth }) => {
  const invalid = validateCuidParam(params.id, "companyId");
  if (invalid) return invalid;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, slug: true },
  });

  if (!company) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  const admin = await prisma.user.findFirst({
    where: { companyId: params.id, role: "ADMIN" },
    select: { id: true, email: true, name: true },
  });

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "No admin user found for this company" },
      { status: 404 }
    );
  }

  const expiresAt = new Date(Date.now() + IMPERSONATION_TTL_HOURS * 60 * 60 * 1000);

  const payload = JSON.stringify({
    superAdminId: auth.id,
    superAdminEmail: auth.email,
    companyId: company.id,
    adminUserId: admin.id,
    expiresAt: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, Buffer.from(payload).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_TTL_HOURS * 60 * 60,
  });

  await writeAuditLog({
    companyId: company.id,
    userId: auth.id,
    action: "impersonation",
    target: `company:${company.id}`,
    metadata: {
      superAdminEmail: auth.email,
      companyName: company.name,
      impersonatedAdmin: admin.email,
    },
    ip: getClientIp(request),
  });

  return NextResponse.json({
    success: true,
    data: {
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
      impersonatingAs: admin.email,
      expiresAt: expiresAt.toISOString(),
    },
  });
});

export const DELETE = withSuperAdmin<Params>(async (_request, { params }) => {
  const invalid = validateCuidParam(params.id, "companyId");
  if (invalid) return invalid;

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);

  return NextResponse.json({
    success: true,
    data: { message: "Impersonation session ended" },
  });
});
