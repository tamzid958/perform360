"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, FileText, Newspaper } from "lucide-react";

const navigation = [
  { name: "Overview", href: "/superadmin", icon: LayoutDashboard },
  { name: "Companies", href: "/superadmin/companies", icon: Building2 },
  { name: "Global Templates", href: "/superadmin/global-templates", icon: FileText },
  { name: "Blog", href: "/superadmin/blog", icon: Newspaper },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[12px] font-bold">P</span>
            </div>
            <span className="text-[15px] font-semibold">Performs360</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-medium">
              Super Admin
            </span>
          </div>
          <button
            onClick={() => signOut({ redirectTo: "/login" })}
            className="text-[14px] text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/superadmin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[13px] sm:text-[14px] font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                <Icon size={16} strokeWidth={1.5} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
