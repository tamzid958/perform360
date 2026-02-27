import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, children, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", compact ? "py-8" : "py-16", className)}>
      <Icon size={compact ? 20 : 28} strokeWidth={1.5} className="text-gray-400" />
      <div className="space-y-1">
        <p className={cn("font-medium uppercase tracking-caps text-gray-900", compact ? "text-[12px]" : "text-[14px]")}>{title}</p>
        {description && (
          <p className={cn("text-gray-500 max-w-xs mx-auto", compact ? "text-[12px]" : "text-[13px]")}>{description}</p>
        )}
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
