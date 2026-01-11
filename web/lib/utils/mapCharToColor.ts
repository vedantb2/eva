// Map characters to predefined colors based on their position in the alphabet
const colorPairs = [
  { light: "#fef3f2", dark: "#dc2626" }, // Red
  { light: "#fff7ed", dark: "#ea580c" }, // Orange
  { light: "#fefce8", dark: "#ca8a04" }, // Yellow
  { light: "#f0fdf4", dark: "#16a34a" }, // Green
  { light: "#ecfdf5", dark: "#059669" }, // Emerald
  { light: "#f0fdfa", dark: "#0d9488" }, // Teal
  { light: "#ecfeff", dark: "#0891b2" }, // Cyan
  { light: "#eff6ff", dark: "#2563eb" }, // Blue
  { light: "#eef2ff", dark: "#4f46e5" }, // Indigo
  { light: "#f5f3ff", dark: "#7c3aed" }, // Violet
  { light: "#faf5ff", dark: "#9333ea" }, // Purple
  { light: "#fdf2f8", dark: "#db2777" }, // Pink (THEME_COLOR)
  { light: "#fef7f3", dark: "#d97706" }, // Amber
  { light: "#fafaf9", dark: "#525252" }, // Neutral
];

export function mapCharToColor(char: string, variant: "light" | "dark"): string {
  const charCode = char.toUpperCase().charCodeAt(0);
  const index = (charCode - 65) % colorPairs.length; // Map A-Z to indices
  return colorPairs[index][variant];
}