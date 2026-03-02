"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Building2, ChevronDown } from "lucide-react";

interface TopNavProps {
  userName?: string;
  userAvatar?: string | null;
  companyName?: string;
  companyCount?: number;
}

export function TopNav({
  userName = "User",
  userAvatar,
  companyName,
  companyCount = 1,
}: TopNavProps) {
  const router = useRouter();

  const handleSwitchCompany = async () => {
    await fetch("/api/auth/clear-company", { method: "POST" });
    router.push("/select-company");
  };

  return (
    <header className="h-14 sm:h-16 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl flex items-center px-4 sm:px-6">
      <MobileNav companyCount={companyCount} />

      {/* Company name (visible on mobile when sidebar is hidden) */}
      {companyName && (
        <div className="lg:hidden flex items-center gap-2 ml-2">
          {companyCount > 1 ? (
            <button
              onClick={handleSwitchCompany}
              className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Building2 size={14} strokeWidth={1.5} />
              <span className="truncate max-w-[120px]">{companyName}</span>
              <ChevronDown size={12} strokeWidth={2} className="text-gray-400" />
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400">
              <Building2 size={14} strokeWidth={1.5} />
              <span className="truncate max-w-[120px]">{companyName}</span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Company switcher for desktop */}
        {companyName && companyCount > 1 && (
          <button
            onClick={handleSwitchCompany}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Building2 size={14} strokeWidth={1.5} />
            <span className="truncate max-w-[160px]">{companyName}</span>
            <ChevronDown size={12} strokeWidth={2} className="text-gray-400" />
          </button>
        )}
        <div className="flex items-center gap-2.5 p-1.5">
          <Avatar src={userAvatar} name={userName} size="sm" />
          <span className="text-[14px] font-medium text-gray-700 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
