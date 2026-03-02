import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
        <Icon size={28} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
      </div>
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {description && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
