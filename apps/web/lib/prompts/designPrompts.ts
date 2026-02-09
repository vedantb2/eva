interface DesignMessage {
  role: string;
  content: string;
}

interface SelectedVariation {
  label: string;
  code: string;
}

export const SANDPACK_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"><\/script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: { DEFAULT: 'rgb(var(--primary))', foreground: 'rgb(var(--primary-foreground))' },
        secondary: { DEFAULT: 'rgb(var(--secondary))', foreground: 'rgb(var(--secondary-foreground))' },
        muted: { DEFAULT: 'rgb(var(--muted))', foreground: 'rgb(var(--muted-foreground))' },
        accent: { DEFAULT: 'rgb(var(--accent))', foreground: 'rgb(var(--accent-foreground))' },
        destructive: { DEFAULT: 'rgb(var(--destructive))', foreground: 'rgb(var(--destructive-foreground))' },
        success: { DEFAULT: 'rgb(var(--success))', foreground: 'rgb(var(--success-foreground))' },
        warning: { DEFAULT: 'rgb(var(--warning))', foreground: 'rgb(var(--warning-foreground))' },
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
        card: { DEFAULT: 'rgb(var(--card))', foreground: 'rgb(var(--card-foreground))' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    }
  }
}
<\/script>
<style>
:root {
  --background: 250 253 252;
  --foreground: 15 23 21;
  --card: 255 255 255;
  --card-foreground: 15 23 21;
  --popover: 255 255 255;
  --popover-foreground: 15 23 21;
  --primary: 16 145 130;
  --primary-foreground: 255 255 255;
  --secondary: 236 245 243;
  --secondary-foreground: 35 60 55;
  --muted: 240 244 243;
  --muted-foreground: 100 120 115;
  --accent: 224 240 236;
  --accent-foreground: 12 105 95;
  --destructive: 220 38 38;
  --destructive-foreground: 255 255 255;
  --success: 22 163 74;
  --success-foreground: 255 255 255;
  --warning: 217 119 6;
  --warning-foreground: 255 255 255;
  --border: 212 228 224;
  --input: 212 228 224;
  --ring: 16 145 130;
  --radius: 1rem;
}
.dark {
  --background: 15 23 21;
  --foreground: 235 245 242;
  --card: 21 31 28;
  --card-foreground: 235 245 242;
  --popover: 18 28 25;
  --popover-foreground: 235 245 242;
  --primary: 72 202 186;
  --primary-foreground: 15 23 21;
  --secondary: 28 42 38;
  --secondary-foreground: 215 230 226;
  --muted: 26 40 36;
  --muted-foreground: 140 168 162;
  --accent: 32 50 45;
  --accent-foreground: 215 230 226;
  --destructive: 239 68 68;
  --destructive-foreground: 255 255 255;
  --success: 74 222 128;
  --success-foreground: 10 18 16;
  --warning: 251 191 36;
  --warning-foreground: 10 18 16;
  --border: 42 60 55;
  --input: 42 60 55;
  --ring: 72 202 186;
  --radius: 1rem;
}
*, *::before, *::after { box-sizing: border-box; border-color: rgb(var(--border)); }
body {
  margin: 0;
  padding: 0;
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.015em;
  -webkit-font-smoothing: antialiased;
}
</style>
</head>
<body><div id="root"></div></body>
</html>`;

export function buildDesignPrompt(
  repo: { owner: string; name: string },
  message: string,
  conversationHistory: DesignMessage[],
  selectedBase: SelectedVariation | null,
): string {
  const history = conversationHistory
    .filter((m) => m.content)
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const baseContext = selectedBase
    ? `\n\n## Selected Base Design\nThe user selected "${selectedBase.label}" as the base. Here is its code:\n\`\`\`jsx\n${selectedBase.code}\n\`\`\`\nIterate on this design based on the user's new request.`
    : "";

  return `You are a UI/UX designer working on the ${repo.owner}/${repo.name} codebase.

## Your Task
Read the codebase to understand the existing design system, then generate 3 React component variations based on the user's request.

## Steps
1. Read CLAUDE.md to understand the project
2. Read the Tailwind config and globals.css to understand the design tokens
3. Read existing components to see how they're structured and styled
4. Generate 3 distinct, interactive React component variations

## Design System
The project uses a custom Tailwind config with CSS variables. Your components will be rendered in an environment that already provides these — just use the utility classes:

**Colors:** bg-background, bg-foreground, bg-primary, bg-secondary, bg-muted, bg-accent, bg-card, bg-destructive, bg-success, bg-warning (and text-* equivalents, plus text-primary-foreground etc.)
**Border:** border-border, border-input
**Radius:** rounded-sm (12px), rounded-md (14px), rounded-lg (16px)
**Font:** font-sans (Inter is loaded automatically)

CRITICAL: Use ONLY these semantic color utilities. NEVER use raw Tailwind colors like bg-blue-500, text-gray-700, bg-teal-600. Always use bg-primary, text-muted-foreground, etc.

## Previous Conversation
${history || "None"}
${baseContext}

## User Request
${message}

## Output Format
Output ONLY valid JSON:
{
  "summary": "Brief description of design decisions",
  "variations": [
    {
      "label": "Design A - [descriptor]",
      "code": "A single React component file. MUST start with: import { useState, useEffect } from 'react'; (import any hooks you need). Then: export default function App() { ... }. Use Tailwind classes for all styling."
    },
    { "label": "Design B - [descriptor]", "code": "..." },
    { "label": "Design C - [descriptor]", "code": "..." }
  ]
}

## Rules
- Each variation must be a single React component file starting with \`import { useState } from 'react';\` (add useEffect or other hooks as needed), then \`export default function App() { ... }\`
- ALWAYS import React hooks from 'react' — do NOT use React.useState or React.useEffect
- Use the semantic Tailwind utilities listed above (bg-primary, text-foreground, rounded-lg, etc.)
- NEVER use raw Tailwind colors (no bg-blue-500, no text-gray-700, no bg-slate-100)
- Add real interactivity: useState for toggles/modals/tabs, onClick handlers, form inputs
- Add hover states (hover:bg-primary/90), transitions (transition-all duration-200), focus rings
- Add subtle animations where appropriate (hover:scale-[1.02], hover:shadow-lg)
- Each variation should be meaningfully different in layout or interaction patterns
- DO NOT modify any files in the codebase
- Output ONLY the JSON, no other text`;
}
