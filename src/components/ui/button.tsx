"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[#0071e3] hover:bg-[#0058b9] text-white rounded-full": variant === "primary",
            "bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full": variant === "secondary",
            "hover:bg-gray-100 text-gray-600 rounded-xl": variant === "ghost",
            "bg-red-50 hover:bg-red-100 text-red-600 rounded-full": variant === "danger",
          },
          {
            "px-4 py-1.5 text-[13px]": size === "sm",
            "px-6 py-2.5 text-[15px]": size === "md",
            "px-8 py-3 text-[17px]": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
