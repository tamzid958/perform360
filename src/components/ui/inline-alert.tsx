import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface InlineAlertProps {
  variant?: "error" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: {
    container: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    icon: AlertCircle,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: AlertTriangle,
  },
  info: {
    container: "bg-brand-50 border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20",
    text: "text-brand-700 dark:text-brand-400",
    icon: Info,
  },
};

export function InlineAlert({ variant = "error", children, className }: InlineAlertProps) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3", v.container, className)}>
      <Icon size={16} strokeWidth={1.5} className={cn("shrink-0 mt-0.5", v.text)} />
      <div className={cn("text-[13px]", v.text)}>{children}</div>
    </div>
  );
}
