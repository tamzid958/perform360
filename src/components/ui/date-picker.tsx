"use client";

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  label?: string;
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Dates before this are disabled */
  minDate?: Date;
  /** Dates after this are disabled */
  maxDate?: Date;
}

function DatePicker({
  id,
  label,
  value,
  onChange,
  placeholder = "Select a date",
  error,
  required,
  disabled,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const isSelectedValid = selectedDate && isValid(selectedDate);

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    }
    setOpen(false);
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-gray-700">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center h-11 px-4 rounded-xl border bg-white text-[15px]",
              "transition-all duration-200 text-left",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
              "disabled:opacity-50 disabled:pointer-events-none",
              error
                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200",
              open && !error && "ring-2 ring-brand-500/40 border-brand-500"
            )}
          >
            <CalendarIcon
              size={16}
              strokeWidth={1.5}
              className={cn(
                "mr-3 shrink-0",
                isSelectedValid ? "text-gray-500" : "text-gray-400"
              )}
            />
            <span
              className={cn(
                "flex-1 truncate",
                isSelectedValid ? "text-gray-900" : "text-gray-400"
              )}
            >
              {isSelectedValid
                ? format(selectedDate, "MMM d, yyyy")
                : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={isSelectedValid ? selectedDate : undefined}
            onSelect={handleSelect}
            defaultMonth={isSelectedValid ? selectedDate : undefined}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

DatePicker.displayName = "DatePicker";

export { DatePicker };
