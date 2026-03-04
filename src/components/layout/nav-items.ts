import {
  LayoutDashboard,
  RefreshCcw,
  Users,
  FileText,
  UserCircle,
  Settings,
  Layers,
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/overview", icon: LayoutDashboard },
  { name: "Cycles", href: "/cycles", icon: RefreshCcw },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Levels", href: "/levels", icon: Layers },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "People", href: "/people", icon: UserCircle },
] as const;

export const bottomNav = [
  { name: "Settings", href: "/settings", icon: Settings },
] as const;
