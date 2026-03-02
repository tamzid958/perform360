import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function CompanySelectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
