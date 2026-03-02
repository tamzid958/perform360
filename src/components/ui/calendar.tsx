"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex items-center justify-center h-7",
        caption_label: "text-[15px] font-semibold text-gray-900",
        nav: "absolute top-3 flex w-full items-center justify-between px-1 z-10",
        button_previous: cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full",
          "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
          "transition-all duration-200 focus:outline-none"
        ),
        button_next: cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full",
          "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
          "transition-all duration-200 focus:outline-none"
        ),
        weekdays: "flex",
        weekday:
          "w-9 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-center",
        week: "flex mt-1",
        day: cn(
          "relative h-9 w-9 flex items-center justify-center text-[14px]",
          "rounded-full transition-all duration-150 cursor-pointer",
          "hover:bg-gray-100 focus:outline-none"
        ),
        day_button: cn(
          "h-9 w-9 inline-flex items-center justify-center rounded-full",
          "text-[14px] font-normal",
          "focus:outline-none cursor-pointer"
        ),
        selected: cn(
          "!bg-brand-500 !text-white !font-medium",
          "hover:!bg-brand-600",
          "shadow-sm"
        ),
        today: "font-semibold text-brand-500",
        outside: "text-gray-300",
        disabled: "text-gray-200 pointer-events-none",
        range_middle: "bg-brand-500/10 rounded-none",
        range_start: "rounded-l-full",
        range_end: "rounded-r-full",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft size={16} strokeWidth={2} />
          ) : (
            <ChevronRight size={16} strokeWidth={2} />
          ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
