import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-white border-gray-900 text-gray-900",
  success: "bg-success-tint border-success text-success",
  warning: "bg-warning-tint border-warning text-warning",
  error: "bg-error-tint border-error text-error",
  info: "bg-info-tint border-info text-info",
  outline: "border-gray-100 text-gray-500",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[12px] font-medium uppercase tracking-caps border",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
