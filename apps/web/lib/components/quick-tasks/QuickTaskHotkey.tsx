"use client";

import { useEffect, useState } from "react";
import { QuickTaskModal } from "./QuickTaskModal";

export function QuickTaskHotkey() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <QuickTaskModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
