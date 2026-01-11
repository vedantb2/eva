import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-dmSans-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl 
            border border-neutral-200 dark:border-neutral-700 
            bg-white dark:bg-neutral-800
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-500 dark:placeholder:text-neutral-400
            font-dmSans-medium text-base
            focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500
            transition-all duration-200
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                : ""
            }
            ${className}
          `}
          style={{
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
          {...props}
        />

        {error && (
          <p className="text-sm font-dmSans-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-sm font-dmSans-medium text-neutral-600 dark:text-neutral-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
