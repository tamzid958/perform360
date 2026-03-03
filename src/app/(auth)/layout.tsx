import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, BarChart3, Users, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedCompanyId } from "@/lib/company-cookie";

const features = [
  {
    icon: BarChart3,
    title: "360-Degree Feedback",
    description: "Collect reviews from managers, peers, and direct reports",
  },
  {
    icon: Shield,
    title: "End-to-End Encrypted",
    description: "Your evaluation data stays private — always",
  },
  {
    icon: Users,
    title: "Team-Based Cycles",
    description: "Auto-generate assignments from team structures",
  },
  {
    icon: Zap,
    title: "Passwordless Access",
    description: "Magic links and OTP — no passwords to remember",
  },
];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.email) {
    const isSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: session.user.email },
    });

    if (isSuperAdmin) {
      redirect("/superadmin");
    }

    const appUser = await prisma.user.findFirst({
      where: { email: session.user.email, archivedAt: null },
      select: { id: true },
    });

    if (appUser) {
      // If user belongs to multiple companies and hasn't selected one, go to selector
      const selectedCompany = await getSelectedCompanyId();
      if (!selectedCompany) {
        const companyCount = await prisma.user.count({
          where: {
            email: session.user.email!,
            role: { in: ["ADMIN", "HR"] },
            archivedAt: null,
          },
        });
        if (companyCount > 1) {
          redirect("/select-company");
        }
      }
      redirect("/overview");
    }
  }
  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative brand showcase */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative flex-col justify-between bg-white border-r border-gray-200/60 p-10 overflow-hidden">
        {/* Background gradient layers */}
        <div
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(0,113,227,0.06), transparent), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(0,68,147,0.04), transparent)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/">
            <Image src="/logo.png" alt="Performs360" width={160} height={30} className="h-8 w-auto" />
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h2 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">
              Performance reviews
              <br />
              <span className="text-gradient-brand">done right.</span>
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed max-w-[340px]">
              Structured feedback from every angle. Beautiful reports.
              Zero complexity.
            </p>
          </div>

          <div className="grid gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-3 rounded-xl bg-gray-50/80 border border-gray-100"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <feature.icon
                    size={18}
                    strokeWidth={1.5}
                    className="text-brand-500"
                  />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-gray-900">
                    {feature.title}
                  </p>
                  <p className="text-[13px] text-gray-400 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[12px] text-gray-300">
            &copy; {new Date().getFullYear()} Performs360. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="flex-1 flex items-center justify-center lg:justify-start bg-gray-100 p-6 sm:p-8 lg:p-16 xl:p-24">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
