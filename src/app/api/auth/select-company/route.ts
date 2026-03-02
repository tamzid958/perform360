import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSelectedCompany } from "@/lib/company-cookie";

const selectSchema = z.object({
  companyId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = selectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid company ID" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.email,
      companyId: parsed.data.companyId,
      role: { in: ["ADMIN", "HR"] },
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await setSelectedCompany(parsed.data.companyId);

  return NextResponse.json({ success: true });
}
