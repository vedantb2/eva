import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeModeContextValue {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}
