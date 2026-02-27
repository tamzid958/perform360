"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-gray-900 border-gray-900" : "bg-white border-gray-900",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 mt-0.5 ml-0.5",
          checked ? "bg-white translate-x-4" : "bg-gray-900"
        )}
      />
    </button>
  );
}
