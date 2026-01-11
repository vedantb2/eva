interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className = "",
  size = "md",
  color = "#db2777", // PINK_600
  showLabel = false,
  label,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400 font-dmSans-medium">
            {label || "Progress"}
          </span>
          <span className="text-neutral-900 dark:text-neutral-100 font-dmSans-semibold">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div
        className={`w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
