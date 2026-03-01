"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard, RefreshCcw, Users, FileText, UserCircle, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/overview", icon: LayoutDashboard },
  { name: "Cycles", href: "/cycles", icon: RefreshCcw },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "People", href: "/people", icon: UserCircle },
];

const bottomNav = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} strokeWidth={1.5} className="text-gray-600" />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[72px] bg-[#f5f5f7]/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col animate-slide-in-left">
            {/* Logo + Close */}
            <div className="flex flex-col items-center gap-2 py-3 p-4">
              <Link href="/overview" onClick={() => setOpen(false)} className="flex items-center justify-center">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <span className="text-white text-[14px] font-bold">P</span>
                </div>
              </Link>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors">
                <X size={16} strokeWidth={1.5} className="text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    title={item.name}
                    className={cn(
                      "flex items-center justify-center px-2 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/40"
                    )}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Navigation */}
            <div className="px-3 py-3 border-t border-gray-200/50 space-y-1">
              {bottomNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    title={item.name}
                    className={cn(
                      "flex items-center justify-center px-2 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/40"
                    )}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </Link>
                );
              })}
              <button
                onClick={() => signOut({ redirectTo: "/login" })}
                title="Sign out"
                className="flex items-center justify-center px-2 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 w-full text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
