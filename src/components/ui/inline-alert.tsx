import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface InlineAlertProps {
  variant?: "error" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: {
    container: "border-error bg-error-tint",
    text: "text-error",
    icon: AlertCircle,
  },
  warning: {
    container: "border-warning bg-warning-tint",
    text: "text-warning",
    icon: AlertTriangle,
  },
  info: {
    container: "border-info bg-info-tint",
    text: "text-info",
    icon: Info,
  },
};

export function InlineAlert({ variant = "error", children, className }: InlineAlertProps) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div className={cn("flex items-start gap-2.5 border px-4 py-3", v.container, className)}>
      <Icon size={16} strokeWidth={1.5} className={cn("shrink-0 mt-0.5", v.text)} />
      <div className={cn("text-[13px]", v.text)}>{children}</div>
    </div>
  );
}
