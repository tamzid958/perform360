"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100",
        {
          "h-8 w-8": size === "sm",
          "h-10 w-10": size === "md",
          "h-12 w-12": size === "lg",
        },
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          className="aspect-square h-full w-full object-cover"
          src={src}
          alt={name}
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white font-medium"
        style={{ fontSize: size === "sm" ? "11px" : size === "md" ? "13px" : "15px" }}
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
