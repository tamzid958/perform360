import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RootPage() {
  const company = await prisma.company.findFirst({ select: { id: true } });

  if (!company) {
    redirect("/onboarding");
  }

  const session = await auth();

  if (session?.user) {
    redirect("/overview");
  }

  redirect("/login");
}
