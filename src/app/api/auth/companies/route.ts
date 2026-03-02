import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      email: session.user.email,
      role: { in: ["ADMIN", "HR"] },
      archivedAt: null,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const companies = users.map((u) => ({
    companyId: u.companyId,
    companyName: u.company.name,
    companySlug: u.company.slug,
    companyLogo: u.company.logo,
    role: u.role,
  }));

  return NextResponse.json({ success: true, data: companies });
}
