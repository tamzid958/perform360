import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full h-11 px-4 rounded-xl border bg-white dark:bg-gray-900 text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200",
            error ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 dark:border-gray-700",
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-[12px] text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
