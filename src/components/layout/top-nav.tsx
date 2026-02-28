"use client";

import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string | null;
}

export function TopNav({ userName = "User", userEmail = "", userAvatar }: TopNavProps) {
  return (
    <header className="h-16 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Avatar src={userAvatar} name={userName} size="sm" />
              <span className="text-[14px] font-medium text-gray-700 hidden sm:block">{userName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-[14px] font-medium text-gray-900">{userName}</div>
              <div className="text-[12px] text-gray-500">{userEmail}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => signOut({ redirectTo: "/login" })}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
