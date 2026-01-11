"use client";

import { IconPlus } from "@tabler/icons-react";
import { usePathname } from "next/navigation";

interface FloatingActionButtonProps {
  onClick: () => void;
  show?: boolean;
}

export function FloatingActionButton({ onClick, show = true }: FloatingActionButtonProps) {
  const pathname = usePathname();
  
  // Show FAB only on medications and readings pages
  const shouldShow = show && (pathname === "/medications" || pathname === "/readings");

  if (!shouldShow) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="fixed z-50 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center justify-center"
      style={{
        right: "20px",
        bottom: "100px", 
        width: "56px",
        height: "56px",
        backgroundColor: "#db2777", // THEME_COLOR
        borderRadius: "28px",
      }}
      aria-label="Add new item"
    >
      <IconPlus size={24} color="white" />
    </button>
  );
}