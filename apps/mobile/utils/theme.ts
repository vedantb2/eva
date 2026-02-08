import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#007AFF",
    background: "#f5f5f5",
    card: "#FFFFFF",
    text: "#000000",
    subtext: "#666666",
    border: "#DDDDDD",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
  },
};

export const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#0A84FF",
    background: "#000000",
    card: "#1C1C1E",
    text: "#FFFFFF",
    subtext: "#8E8E93",
    border: "#38383A",
    success: "#32D74B",
    warning: "#FF9F0A",
    error: "#FF453A",
  },
};

export type AppTheme = typeof lightTheme;
