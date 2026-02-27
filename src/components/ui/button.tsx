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
          "inline-flex items-center justify-center font-medium uppercase tracking-caps text-[14px] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gray-900 hover:bg-gray-700 text-white": variant === "primary",
            "bg-white hover:bg-gray-50 text-gray-900 border border-gray-900": variant === "secondary" || variant === "danger",
            "hover:bg-gray-50 text-gray-500": variant === "ghost",
          },
          {
            "px-4 py-1.5 text-[12px]": size === "sm",
            "px-6 py-3 text-[14px]": size === "md",
            "px-8 py-3.5 text-[14px]": size === "lg",
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
