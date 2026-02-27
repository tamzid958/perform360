import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, startIcon, endIcon, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-[14px] font-medium uppercase tracking-caps text-gray-900">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              "w-full h-11 px-3 border bg-white text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:outline-accent focus:outline-offset-2",
              error ? "border-gray-900" : "border-gray-900",
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {endIcon}
            </span>
          )}
        </div>
        {error && <p id={errorId} className="text-[12px] text-gray-900" role="alert">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
