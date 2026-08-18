import { createContext, useContext } from "react";
import type { ThemeMode } from "@/lib/hooks/useThemeMode";
import type { CustomTheme } from "@/lib/contexts/themeTokens";

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  mounted: boolean;
  customTheme: CustomTheme;
  setCustomTheme: (customTheme: CustomTheme) => void;
}

export const ThemeStateContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export function useThemeContext() {
  const context = useContext(ThemeStateContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
