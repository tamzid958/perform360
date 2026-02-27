"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0 border-b border-gray-100 overflow-x-auto max-w-full",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 text-[14px] font-medium uppercase tracking-caps text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-accent whitespace-nowrap shrink-0",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus:outline-none", className)}
      {...props}
    />
  );
}
