"use client";

import { Avatar } from "@/components/ui/avatar";
import { MobileNav } from "@/components/layout/mobile-nav";

interface TopNavProps {
  userName?: string;
  userAvatar?: string | null;
}

export function TopNav({ userName = "User", userAvatar }: TopNavProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl flex items-center px-4 sm:px-6">
      <MobileNav />
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2.5 p-1.5">
          <Avatar src={userAvatar} name={userName} size="sm" />
          <span className="text-[14px] font-medium text-gray-700 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
