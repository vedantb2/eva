"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useTheme } from "next-themes";
import { useQuery, useMutation } from "convex/react";
import { api } from "conductor-backend";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme: setNextTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const syncedTheme = useQuery(api.auth.getTheme);
  const setThemeMutation = useMutation(api.auth.setTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (syncedTheme === undefined || syncedTheme === null) return;
    if (syncedTheme !== theme) {
      setNextTheme(syncedTheme);
    }
  }, [syncedTheme]);

  const setTheme = useCallback(
    (next: string) => {
      setNextTheme(next);
      if (next === "light" || next === "dark") {
        setThemeMutation({ theme: next });
      }
    },
    [setNextTheme, setThemeMutation],
  );

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: theme || "dark",
        setTheme,
        toggleTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
