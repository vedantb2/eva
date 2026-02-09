import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";
import { themeExtend } from "./lib/tailwind-theme.js";

/** @type {import('tailwindcss').Config} */

const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/streamdown/dist/**/*.js",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: { extend: themeExtend },
  plugins: [tailwindcssAnimate, tailwindcssTypography],
};
export default config;
