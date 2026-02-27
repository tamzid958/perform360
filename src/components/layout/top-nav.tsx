"use client";

import { Bell, Search } from "lucide-react";
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
    <header className="h-16 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-gray-100 border-none text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell size={20} strokeWidth={1.5} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

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
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
