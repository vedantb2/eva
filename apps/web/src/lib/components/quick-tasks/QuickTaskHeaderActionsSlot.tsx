"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type QuickTaskHeaderActionsSlotContextValue = {
  slotElement: HTMLDivElement | null;
  setSlotElement: (element: HTMLDivElement | null) => void;
};

const QuickTaskHeaderActionsSlotContext =
  createContext<QuickTaskHeaderActionsSlotContextValue | null>(null);

export function QuickTaskHeaderActionsSlotProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [slotElement, setSlotElement] = useState<HTMLDivElement | null>(null);

  return (
    <QuickTaskHeaderActionsSlotContext value={{ slotElement, setSlotElement }}>
      {children}
    </QuickTaskHeaderActionsSlotContext>
  );
}

export function useQuickTaskHeaderActionsSlot() {
  return useContext(QuickTaskHeaderActionsSlotContext);
}

/** Mount point for task actions between context usage and prev/next controls. */
export function QuickTaskHeaderActionsSlot() {
  const slot = useQuickTaskHeaderActionsSlot();
  if (!slot) {
    return null;
  }

  return (
    <div
      ref={slot.setSlotElement}
      className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end"
    />
  );
}
