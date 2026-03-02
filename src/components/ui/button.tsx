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
          "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-brand-500 hover:bg-brand-600 text-white": variant === "primary",
            "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100": variant === "secondary",
            "hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400": variant === "ghost",
            "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-400": variant === "danger",
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
