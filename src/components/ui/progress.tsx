"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  /** Auto-color the bar based on value: >=75 success, >=40 warning, <40 error */
  semantic?: boolean;
}

function getSemanticClass(value: number): string {
  if (value >= 75) return "bg-success";
  if (value >= 40) return "bg-warning";
  return "bg-error";
}

export function Progress({ value, className, indicatorClassName, semantic }: ProgressProps) {
  return (
    <div className={cn("relative h-1 w-full overflow-hidden bg-gray-100", className)}>
      <div
        className={cn(
          "h-full",
          semantic ? getSemanticClass(value) : "bg-gray-900",
          indicatorClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
