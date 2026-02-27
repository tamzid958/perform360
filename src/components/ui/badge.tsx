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
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-green-50 text-green-700": variant === "success",
          "bg-amber-50 text-amber-700": variant === "warning",
          "bg-red-50 text-red-700": variant === "error",
          "bg-blue-50 text-blue-700": variant === "info",
          "border border-gray-200 text-gray-600": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
