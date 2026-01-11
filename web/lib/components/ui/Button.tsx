import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50";
    const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
    const variants = {
      primary: "bg-pink-600 text-white hover:bg-pink-700",
      secondary: "border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800",
      ghost: "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    };

    return (
      <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
