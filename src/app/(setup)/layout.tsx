import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
