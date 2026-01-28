import { heroui } from "@heroui/react";
import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */

const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
    // make sure it's pointing to the ROOT node_module
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: "#f0fdfa",
              100: "#ccfbf1",
              200: "#99f6e4",
              300: "#5eead4",
              400: "#2dd4bf",
              500: "#14b8a6",
              600: "#0d9488",
              700: "#0f766e",
              800: "#115e59",
              900: "#134e4a",
              DEFAULT: "#14b8a6",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              50: "#f0fdfa",
              100: "#ccfbf1",
              200: "#99f6e4",
              300: "#5eead4",
              400: "#2dd4bf",
              500: "#14b8a6",
              600: "#0d9488",
              700: "#0f766e",
              800: "#115e59",
              900: "#134e4a",
              DEFAULT: "#2dd4bf",
              foreground: "#000000",
            },
          },
        },
      },
    }),
  ],
};
export default config;
