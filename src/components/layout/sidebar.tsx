"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  RefreshCcw,
  Users,
  FileText,
  UserCircle,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";

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

interface SidebarProps {
  companyName?: string;
  companyCount?: number;
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[12px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50 shadow-md">
        {label}
      </div>
    </div>
  );
}

export function Sidebar({ companyName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { canManageSettings } = usePermissions();

  function NavLink({ name, href, icon: Icon }: { name: string; href: string; icon: typeof LayoutDashboard }) {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    const link = (
      <Link
        href={href}
        aria-label={collapsed ? name : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
          isActive
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-800/40",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon size={20} strokeWidth={1.5} />
        {!collapsed && <span>{name}</span>}
      </Link>
    );
    return collapsed ? <Tooltip label={name}>{link}</Tooltip> : link;
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex h-screen bg-gray-100/80 dark:bg-gray-950/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center p-4",
          collapsed ? "flex-col justify-center gap-2 py-3" : "h-16 justify-between"
        )}
      >
        <Link
          href="/overview"
          className={cn("flex items-center gap-2", collapsed && "justify-center")}
        >
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white text-[14px] font-bold">P</span>
          </div>
          {!collapsed && (
            <span className="text-headline text-gray-900 dark:text-gray-100">Performs360</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={16}
            strokeWidth={1.5}
            className={cn("text-gray-400 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Company name */}
      {companyName && !collapsed && (
        <div className="px-4 pb-2">
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wider truncate">
            {companyName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink key={item.name} {...item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-3 border-t border-gray-200/50 dark:border-gray-800/50 space-y-1">
        {canManageSettings && bottomNav.map((item) => (
          <NavLink key={item.name} {...item} />
        ))}
        {(() => {
          const signOutButton = (
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              aria-label={collapsed ? "Sign out" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut size={20} strokeWidth={1.5} />
              {!collapsed && <span>Sign out</span>}
            </button>
          );
          return collapsed ? <Tooltip label="Sign out">{signOutButton}</Tooltip> : signOutButton;
        })()}
      </div>
    </aside>
  );
}
