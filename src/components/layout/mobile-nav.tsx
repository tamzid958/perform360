"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { navigation, bottomNav } from "./nav-items";

interface MobileNavProps {
  companyCount?: number;
}

export function MobileNav({ companyCount = 1 }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { canManageSettings } = usePermissions();

  const handleSwitchCompany = async () => {
    setOpen(false);
    await fetch("/api/auth/clear-company", { method: "POST" });
    router.push("/select-company");
  };

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} strokeWidth={1.5} className="text-gray-600" />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[200px] bg-gray-100/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col animate-slide-in-left">
            {/* Logo + Close */}
            <div className="flex items-center justify-between p-4 h-16">
              <Link href="/overview" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Image src="/logo.png" alt="Performs360" width={120} height={22} className="h-6 w-auto shrink-0" />
              </Link>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors" aria-label="Close navigation menu">
                <X size={16} strokeWidth={1.5} className="text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Main navigation">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-label={item.name}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/40"
                    )}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Navigation */}
            <div className="px-3 py-3 border-t border-gray-200/50 space-y-1">
              {canManageSettings && bottomNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-label={item.name}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/40"
                    )}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {companyCount > 1 && (
                <button
                  onClick={handleSwitchCompany}
                  aria-label="Switch Company"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 w-full text-gray-500 hover:text-gray-700 hover:bg-gray-200/40"
                >
                  <Building2 size={18} strokeWidth={1.5} />
                  <span>Switch</span>
                </button>
              )}
              <button
                onClick={() => signOut({ redirectTo: "/login" })}
                aria-label="Sign out"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 w-full text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} strokeWidth={1.5} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
