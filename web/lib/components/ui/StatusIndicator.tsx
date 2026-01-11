"use client";

interface StatusIndicatorProps {
  status: "normal" | "warning" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusIndicator({ status, size = "md", className = "" }: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "#16a34a"; // green-600
      case "normal":
        return "#16a34a"; // green-600
      case "warning":
        return "#ea580c"; // orange-600
      case "danger":
        return "#dc2626"; // red-600
      default:
        return "#6b7280"; // gray-500
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-1.5 h-1.5";
      case "md":
        return "w-2 h-2";
      case "lg":
        return "w-3 h-3";
      default:
        return "w-2 h-2";
    }
  };

  return (
    <div
      className={`rounded-full ${getSizeClasses()} ${className}`}
      style={{ backgroundColor: getStatusColor() }}
    />
  );
}