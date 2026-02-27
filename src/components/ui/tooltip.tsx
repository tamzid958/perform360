"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden bg-gray-900 px-3 py-1.5 text-[12px] text-white border border-gray-900",
        className
      )}
      {...props}
    />
  );
}
