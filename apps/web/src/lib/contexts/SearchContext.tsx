"use client";

import { createContext, useContext, useState } from "react";
import { useShortcut } from "@/lib/hotkeys/useShortcut";

interface SearchContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useShortcut("openSearch", (e) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  });

  return (
    <SearchContext.Provider
      value={{ isOpen, setIsOpen, openSearch: () => setIsOpen(true) }}
    >
      {children}
    </SearchContext.Provider>
  );
}

const fallback: SearchContextValue = {
  isOpen: false,
  setIsOpen: () => {},
  openSearch: () => {},
};

export function useSearch() {
  const ctx = useContext(SearchContext);
  return ctx ?? fallback;
}
