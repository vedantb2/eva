# Design Tokens & CSS Variables Documentation

This document defines the color design token system for Conductor, including CSS custom properties for both light and dark themes.

## Table of Contents
- [Overview](#overview)
- [Color Token Structure](#color-token-structure)
- [Semantic Color Tokens](#semantic-color-tokens)
- [Usage Guidelines](#usage-guidelines)
- [Implementation Details](#implementation-details)

## Overview

Conductor uses a semantic color token system based on CSS custom properties (CSS variables) that automatically adapt to light and dark themes. All colors are defined using HSL color space for easier manipulation and consistency.

### Color Format
All color tokens use HSL (Hue, Saturation, Lightness) format: `H S% L%`

Example: `48 96% 53%` represents yellow (#eab308)

## Color Token Structure

### Base Tokens

#### Background & Surface Colors

| Token Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| `--background` | `0 0% 98.04%` (neutral-50, #fafafa) | `0 0% 9.02%` (neutral-900, #171717) | Main application background |
| `--foreground` | `0 0% 9.02%` (neutral-900, #171717) | `0 0% 96.08%` (neutral-100, #f5f5f5) | Primary text color |
| `--card` | `0 0% 100%` (white) | `0 0% 14.9%` (neutral-800, #262626) | Card/panel backgrounds |
| `--card-foreground` | `0 0% 9.02%` (neutral-900, #171717) | `0 0% 96.08%` (neutral-100, #f5f5f5) | Text on cards |
| `--popover` | `0 0% 100%` (white) | `0 0% 14.9%` (neutral-800, #262626) | Popover/dropdown backgrounds |
| `--popover-foreground` | `0 0% 9.02%` (neutral-900, #171717) | `0 0% 96.08%` (neutral-100, #f5f5f5) | Text in popovers |

#### Brand Colors

| Token Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| `--primary` | `48 96% 53%` (YELLOW_500, #eab308) | `48 96% 53%` (YELLOW_500, #eab308) | Primary brand color (yellow) |
| `--primary-foreground` | `0 0% 9%` (neutral-900) | `0 0% 9%` (neutral-900) | Text on primary color |
| `--secondary` | `142 76% 36%` (GREEN_600, #16a34a) | `142 71% 45%` (GREEN_500, #22c55e) | Secondary brand color (green) |
| `--secondary-foreground` | `0 0% 100%` (white) | `0 0% 100%` (white) | Text on secondary color |

#### Muted & Accent Colors

| Token Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| `--muted` | `0 0% 96.08%` (neutral-100, #f5f5f5) | `0 0% 25.1%` (neutral-700, #404040) | Muted/subtle backgrounds |
| `--muted-foreground` | `0 0% 45.1%` (neutral-500, #737373) | `0 0% 63.92%` (neutral-400, #a3a3a3) | Secondary text, hints |
| `--accent` | `0 0% 96.08%` (neutral-100, #f5f5f5) | `0 0% 25.1%` (neutral-700, #404040) | Accent backgrounds (hover states) |
| `--accent-foreground` | `0 0% 9.02%` (neutral-900, #171717) | `0 0% 96.08%` (neutral-100, #f5f5f5) | Text on accent backgrounds |

#### Interactive Elements

| Token Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| `--border` | `0 0% 89.8%` (neutral-200, #e5e5e5) | `0 0% 25.1%` (neutral-700, #404040) | Border colors |
| `--input` | `0 0% 89.8%` (neutral-200, #e5e5e5) | `0 0% 25.1%` (neutral-700, #404040) | Input field borders |
| `--ring` | `48 96% 53%` (YELLOW_500, #eab308) | `48 96% 53%` (YELLOW_500, #eab308) | Focus ring color |

#### Status Colors

| Token Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Destructive actions, errors |
| `--destructive-foreground` | `0 0% 98%` | `0 85.7% 97.3%` | Text on destructive backgrounds |

#### Glass Effects

| Token Name | Value | Usage |
|------------|-------|-------|
| `--glass-background` | `255 255 255 / 0.85` | Semi-transparent glass backgrounds |
| `--glass-border` | `214.3 31.8% 91.4% / 0.5` | Glass element borders |
| `--glass-highlight` | `0 0% 100% / 0.7` | Glass highlight effects |
| `--glass-shadow` | `0 0% 0% / 0.1` | Glass shadow effects |

### Semantic Color Tokens

These tokens are used for UI elements with specific semantic meanings:

| Token Name | HSL Value | Hex Value | Usage |
|------------|-----------|-----------|-------|
| `--color-blue` | `217 91% 60%` | #3b82f6 | Information, links |
| `--color-green` | `142 76% 36%` | #16a34a | Success, positive actions |
| `--color-orange` | `25 95% 53%` | #f97316 | Warnings |
| `--color-purple` | `262 83% 58%` | #a855f7 | Special features |
| `--color-red` | `0 84% 60%` | #ef4444 | Errors, destructive actions |
| `--color-yellow` | `48 96% 53%` | #eab308 | Highlights, primary brand |
| `--color-teal` | `173 58% 39%` | #14b8a6 | Secondary information |
| `--color-pink` | `330 81% 60%` | #ec4899 | Special highlights |

### Layout Tokens

| Token Name | Value | Usage |
|------------|-------|-------|
| `--radius` | `1.25rem` | Default border radius (20px) |

## Usage Guidelines

### In CSS/Tailwind

Use CSS variables with the `hsl()` function:

```css
/* Background colors */
background-color: hsl(var(--background));
color: hsl(var(--foreground));

/* With opacity */
background-color: hsl(var(--primary) / 0.1);

/* Borders */
border-color: hsl(var(--border));
```

### In Tailwind Classes

Tailwind is configured to use these tokens automatically:

```jsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
  <div className="border-border bg-card text-card-foreground">
    Card content
  </div>
</div>
```

### Theme Switching

Add the `.dark` class to the root element to enable dark mode:

```jsx
// Light mode
<html>
  ...
</html>

// Dark mode
<html class="dark">
  ...
</html>
```

### Component-Specific Usage

#### Cards
```jsx
<div className="app-card">
  {/* Automatically uses --card background and --card-foreground text */}
</div>
```

#### Buttons
```jsx
<button className="app-button-primary">
  {/* Uses --primary background and --primary-foreground text */}
</button>

<button className="app-button-secondary">
  {/* Uses --secondary background and --secondary-foreground text */}
</button>
```

#### Inputs
```jsx
<input className="app-input" />
{/* Uses --input border, --background bg, --foreground text */}
```

### Status Indicators

Use semantic color tokens for icons and status indicators:

```jsx
<div className="icon-blue">Information</div>
<div className="icon-green">Success</div>
<div className="icon-orange">Warning</div>
<div className="icon-red">Error</div>
<div className="icon-yellow">Highlight</div>
```

## Implementation Details

### File Locations

- **Web App**: `/web/app/globals.css`
- **Mobile App**: `/mobile/global.css`

### Theme Definition Structure

```css
@layer base {
  :root {
    /* Light mode variables */
    --background: 0 0% 98.04%;
    --foreground: 0 0% 9.02%;
    /* ... more variables ... */
  }

  .dark {
    /* Dark mode variables */
    --background: 0 0% 9.02%;
    --foreground: 0 0% 96.08%;
    /* ... more variables ... */
  }
}
```

### High Contrast Mode Support

For users who prefer high contrast, the system automatically adjusts colors:

```css
@media (prefers-contrast: high) {
  .app-card {
    @apply border-white/30;
  }
  /* Icon colors become lighter in dark mode */
}
```

### Reduced Motion Support

For users with motion sensitivity:

```css
@media (prefers-reduced-motion: reduce) {
  .app-card,
  .app-button,
  .app-input {
    @apply transition-none;
  }
}
```

## Best Practices

1. **Always use semantic tokens**: Use `--background` instead of hardcoded colors
2. **Respect theme boundaries**: Don't override theme colors unless absolutely necessary
3. **Test both themes**: Always verify your UI in both light and dark modes
4. **Use foreground pairs**: Always pair background tokens with their foreground counterparts
   - `--background` with `--foreground`
   - `--card` with `--card-foreground`
   - `--primary` with `--primary-foreground`
5. **Leverage opacity**: Use HSL with opacity for subtle variations: `hsl(var(--primary) / 0.1)`
6. **Maintain contrast**: Ensure sufficient contrast ratios for accessibility (WCAG AA: 4.5:1 for text)

## Examples

### Creating a Themed Card

```jsx
<div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-lg">
  <h2 className="text-lg font-medium mb-2">Card Title</h2>
  <p className="text-muted-foreground">Card description text</p>
  <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl">
    Action
  </button>
</div>
```

### Status Badge

```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
  <span className="status-dot-green" />
  Active
</span>
```

### Accessible Focus State

```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background">
  Accessible Button
</button>
```

## Migration Guide

If you have hardcoded colors, replace them with tokens:

| Old (Hardcoded) | New (Token) |
|----------------|-------------|
| `bg-white` | `bg-background` or `bg-card` |
| `text-black` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `bg-yellow-500` | `bg-primary` |
| `bg-green-600` | `bg-secondary` |

## Contributing

When adding new color tokens:

1. Define them in both `:root` (light) and `.dark` (dark) selectors
2. Use semantic names that describe purpose, not appearance
3. Document the token in this file
4. Test in both themes
5. Ensure WCAG AA contrast compliance

## References

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [HSL Color Format (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Theme Configuration](https://tailwindcss.com/docs/theme)
