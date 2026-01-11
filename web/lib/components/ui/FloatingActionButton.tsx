"use client";

import { IconPlus } from "@tabler/icons-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  ariaLabel?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon: Icon = IconPlus,
  ariaLabel = "Add item",
  className = ""
}: FloatingActionButtonProps) {
  const THEME_COLOR = "#db2777"; // PINK_600

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 z-50 ${className}`}
      style={{
        backgroundColor: THEME_COLOR,
      }}
    >
      <Icon size={24} color="white" />
    </button>
  );
}