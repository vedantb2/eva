import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

function c(name) {
  return `rgb(var(--${name}) / <alpha-value>)`;
}

/** Raw `rgb()` from a token — prose CSS variables take plain values, not the
 * `<alpha-value>` placeholder form that `c()` produces for colour utilities. */
function t(name, alpha) {
  return alpha === undefined
    ? `rgb(var(--${name}))`
    : `rgb(var(--${name}) / ${alpha})`;
}

/** Maps Tailwind Typography's colour variables onto the design tokens. */
function proseTokenCss() {
  return {
    "--tw-prose-body": t("foreground"),
    "--tw-prose-headings": t("foreground"),
    "--tw-prose-lead": t("muted-foreground"),
    "--tw-prose-links": t("primary"),
    "--tw-prose-bold": t("foreground"),
    "--tw-prose-counters": t("muted-foreground"),
    "--tw-prose-bullets": t("muted-foreground"),
    "--tw-prose-hr": t("border"),
    "--tw-prose-quotes": t("foreground"),
    "--tw-prose-quote-borders": t("border"),
    "--tw-prose-captions": t("muted-foreground"),
    "--tw-prose-kbd": t("foreground"),
    // Used directly as a box-shadow colour, so the translucency is baked in
    // (upstream default is the heading colour at 10%).
    "--tw-prose-kbd-shadows": t("foreground", 0.1),
    "--tw-prose-code": t("foreground"),
    "--tw-prose-pre-code": t("foreground"),
    "--tw-prose-pre-bg": t("muted"),
    "--tw-prose-th-borders": t("border"),
    "--tw-prose-td-borders": t("border"),
  };
}

export const themeExtend = {
  colors: {
    border: c("border"),
    input: c("input"),
    ring: c("ring"),
    background: c("background"),
    foreground: c("foreground"),
    primary: { DEFAULT: c("primary"), foreground: c("primary-foreground") },
    secondary: {
      DEFAULT: c("secondary"),
      foreground: c("secondary-foreground"),
    },
    destructive: {
      DEFAULT: c("destructive"),
      foreground: c("destructive-foreground"),
    },
    success: { DEFAULT: c("success"), foreground: c("success-foreground") },
    warning: { DEFAULT: c("warning"), foreground: c("warning-foreground") },
    muted: { DEFAULT: c("muted"), foreground: c("muted-foreground") },
    // Tier below `muted-foreground`, for metadata that must recede without
    // becoming unreadable. Replaces the nine ad-hoc `text-muted-foreground/NN`
    // alphas, the lightest of which fell under WCAG AA at body sizes.
    "subtle-foreground": c("subtle-foreground"),
    accent: { DEFAULT: c("accent"), foreground: c("accent-foreground") },
    popover: { DEFAULT: c("popover"), foreground: c("popover-foreground") },
    card: { DEFAULT: c("card"), foreground: c("card-foreground") },
    sidebar: {
      DEFAULT: c("sidebar"),
      foreground: c("sidebar-foreground"),
      primary: c("sidebar-primary"),
      "primary-foreground": c("sidebar-primary-foreground"),
      accent: c("sidebar-accent"),
      "accent-foreground": c("sidebar-accent-foreground"),
      border: c("sidebar-border"),
      ring: c("sidebar-ring"),
    },
    chart: {
      1: c("chart-1"),
      2: c("chart-2"),
      3: c("chart-3"),
      4: c("chart-4"),
      5: c("chart-5"),
    },
    "warning-bg": c("warning-bg"),
    "success-bg": c("success-bg"),
    status: {
      progress: {
        DEFAULT: c("status-progress"),
        bg: c("status-progress-bg"),
        subtle: c("status-progress-subtle"),
        bar: c("status-progress-bar"),
      },
      "business-review": {
        DEFAULT: c("status-business-review"),
        bg: c("status-business-review-bg"),
        subtle: c("status-business-review-subtle"),
        bar: c("status-business-review-bar"),
      },
      "code-review": {
        DEFAULT: c("status-code-review"),
        bg: c("status-code-review-bg"),
        subtle: c("status-code-review-subtle"),
        bar: c("status-code-review-bar"),
      },
      done: {
        DEFAULT: c("status-done"),
        bg: c("status-done-bg"),
        subtle: c("status-done-subtle"),
        bar: c("status-done-bar"),
      },
      cancelled: {
        DEFAULT: c("status-cancelled"),
        bg: c("status-cancelled-bg"),
        subtle: c("status-cancelled-subtle"),
        bar: c("status-cancelled-bar"),
      },
    },
  },
  boxShadow: {
    "2xs": "var(--shadow-2xs)",
    xs: "var(--shadow-xs)",
    sm: "var(--shadow-sm)",
    DEFAULT: "var(--shadow)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
    "2xl": "var(--shadow-2xl)",
  },
  // `--radius` is user-set and spans 0 to 9999px, so every derived step needs
  // both ends bounded: unbounded subtraction goes negative (invalid) at
  // `radius: none`, and unbounded addition stays a pill at `radius: full`,
  // collapsing the scale to one value. `lg` is deliberately left raw — pill-able
  // single-line rows are the intent, and `button.tsx` depends on it.
  borderRadius: {
    surface: "clamp(0.75rem, var(--radius), 1.25rem)",
    control: "min(var(--radius), 1.25rem)",
    "menu-item": "min(var(--radius), 0.75rem)",
    "2xl": "min(calc(var(--radius) + 8px), 2rem)",
    xl: "min(calc(var(--radius) + 4px), 1.5rem)",
    lg: "var(--radius)",
    md: "max(0px, min(calc(var(--radius) - 2px), 0.625rem))",
    sm: "max(0px, min(calc(var(--radius) - 4px), 0.375rem))",
  },
  // Tailwind ships no step below `xs` (12px), which is why 220+ call sites
  // hand-rolled `text-[Npx]` across ten values including half-pixels. These two
  // absorb that range; `xs` and up keep Tailwind's defaults untouched.
  fontSize: {
    "3xs": ["0.625rem", { lineHeight: "0.875rem" }],
    "2xs": ["0.6875rem", { lineHeight: "1rem" }],
  },
  // The de-facto heading tracking, previously repeated as a literal in ~6 files.
  letterSpacing: {
    heading: "-0.02em",
  },
  fontFamily: {
    sans: ["var(--font-sans)"],
    mono: ["var(--font-mono)"],
  },
  // Tailwind Typography ships an unthemed grey palette, which fights the design
  // tokens wherever rendered markdown sits next to normal UI text. Both the base
  // and `prose-invert` variable sets point at the same tokens, because the tokens
  // already flip on `.dark` — so `dark:prose-invert` becomes a harmless no-op.
  typography: {
    DEFAULT: { css: proseTokenCss() },
    invert: { css: proseTokenCss() },
  },
};

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: { extend: themeExtend },
  plugins: [tailwindcssAnimate, tailwindcssTypography],
};
export default config;
