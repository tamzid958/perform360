import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";
import { SetupSignOut } from "@/components/layout/setup-sign-out";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col p-6">
        <div className="flex justify-end">
          <SetupSignOut />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xl">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
