import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const features = [
  {
    title: "360-Degree Feedback",
    description: "Collect reviews from managers, peers, and direct reports",
  },
  {
    title: "End-to-End Encrypted",
    description: "Your evaluation data stays private — always",
  },
  {
    title: "Team-Based Cycles",
    description: "Auto-generate assignments from team structures",
  },
  {
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
    const appUser = await prisma.user.findFirst({
      where: { email: session.user.email, archivedAt: null },
      select: { id: true },
    });

    if (appUser) {
      redirect("/overview");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand showcase */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-white border-r border-gray-900 p-10">
        <div>
          <Link href="/">
            <Logo className="h-12 w-auto" />
          </Link>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-gray-900 font-serif">
              Performance reviews
              <br />
              done right.
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed max-w-[340px]">
              Structured feedback from every angle. Beautiful reports.
              Zero complexity.
            </p>
          </div>

          <div className="w-12 h-0.5 bg-accent" />

          <div className="grid gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-1">
                <p className="text-[11px] font-medium tracking-widest uppercase text-gray-900">
                  {feature.title}
                </p>
                <p className="text-[13px] text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

        </div>

        <div>
          <p className="text-[12px] text-gray-400">
            &copy; {new Date().getFullYear()} Performs360
          </p>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="flex-1 flex items-center justify-start lg:justify-center bg-gray-50 p-6 sm:p-8 lg:p-16 xl:p-24">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
