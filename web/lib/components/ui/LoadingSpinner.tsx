"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "#db2777",
  className = "",
}: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      case "xl":
        return "w-12 h-12";
      default:
        return "w-6 h-6";
    }
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 ${getSizeClasses()} ${className}`}
      style={{
        borderTopColor: color,
      }}
    />
  );
}

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 ${className}`}
    >
      <LoadingSpinner size={size} />
      <p className="mt-3 text-sm font-dmSans-medium text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
    </div>
  );
}
