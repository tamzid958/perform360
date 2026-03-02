import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium",
        {
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300": variant === "default",
          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400": variant === "success",
          "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400": variant === "warning",
          "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400": variant === "error",
          "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400": variant === "info",
          "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
