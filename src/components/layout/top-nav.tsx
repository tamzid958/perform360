"use client";

import { Avatar } from "@/components/ui/avatar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Building2 } from "lucide-react";

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
}: TopNavProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-gray-900 bg-white flex items-center px-4 sm:px-6">
      <MobileNav />

      {companyName && (
        <div className="lg:hidden flex items-center gap-2 ml-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-caps text-gray-400">
            <Building2 size={14} strokeWidth={1.5} />
            <span className="truncate max-w-[120px]">{companyName}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2.5 p-1.5">
          <Avatar src={userAvatar} name={userName} size="sm" />
          <span className="text-[14px] font-medium text-gray-900 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
