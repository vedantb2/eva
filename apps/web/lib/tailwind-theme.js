function c(name) {
  return `rgb(var(--${name}) / <alpha-value>)`;
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
    },
  },
  borderRadius: {
    xl: "calc(var(--radius) + 4px)",
    lg: "var(--radius)",
    md: "calc(var(--radius) - 2px)",
    sm: "calc(var(--radius) - 4px)",
  },
  fontFamily: {
    sans: ["var(--font-sans)"],
    serif: ["var(--font-serif)"],
    mono: ["var(--font-mono)"],
  },
};
