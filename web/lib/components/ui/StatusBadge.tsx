"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

interface StatusBadgeProps {
  status: "normal" | "elevated" | "high" | "low" | "excellent" | "good" | "fair" | "poor";
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig = {
  normal: {
    bgColor: "bg-green-500/20 dark:bg-green-500/10",
    textColor: "text-green-600 dark:text-green-400", 
    borderColor: "border-green-500/30",
    dot: "bg-green-500",
    defaultText: "Normal",
  },
  elevated: {
    bgColor: "bg-yellow-500/20 dark:bg-yellow-500/10",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-500/30", 
    dot: "bg-yellow-500",
    defaultText: "Elevated",
  },
  high: {
    bgColor: "bg-red-500/20 dark:bg-red-500/10",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500/30",
    dot: "bg-red-500", 
    defaultText: "High",
  },
  low: {
    bgColor: "bg-blue-500/20 dark:bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30",
    dot: "bg-blue-500",
    defaultText: "Low", 
  },
  excellent: {
    bgColor: "bg-emerald-500/20 dark:bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
    dot: "bg-emerald-500",
    defaultText: "Excellent",
  },
  good: {
    bgColor: "bg-green-500/20 dark:bg-green-500/10", 
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-500/30",
    dot: "bg-green-500",
    defaultText: "Good",
  },
  fair: {
    bgColor: "bg-orange-500/20 dark:bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400", 
    borderColor: "border-orange-500/30",
    dot: "bg-orange-500",
    defaultText: "Fair",
  },
  poor: {
    bgColor: "bg-red-500/20 dark:bg-red-500/10",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500/30",
    dot: "bg-red-500", 
    defaultText: "Poor",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-1 text-xs",
    dot: "w-1.5 h-1.5",
  },
  md: {
    container: "px-3 py-1.5 text-sm", 
    dot: "w-2 h-2",
  },
  lg: {
    container: "px-4 py-2 text-base",
    dot: "w-2.5 h-2.5", 
  },
};

export function StatusBadge({ 
  status, 
  text, 
  size = "md", 
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
      config.bgColor,
      config.textColor, 
      config.borderColor,
      sizeClasses.container,
      className
    )}>
      <div className={cn(
        "rounded-full",
        config.dot,
        sizeClasses.dot
      )} />
      <span>{text || config.defaultText}</span>
    </div>
  );
}