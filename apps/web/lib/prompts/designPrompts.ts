interface DesignMessage {
  role: string;
  content: string;
}

interface SelectedVariation {
  label: string;
  code: string;
}

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
    ? `\n\n## Selected Base Design
The user selected "${selectedBase.label}" as the base. Here is its code:
\`\`\`jsx
${selectedBase.code}
\`\`\`
IMPORTANT: Preserve the core layout structure, color choices, and interaction patterns from this base.
Only change what the user explicitly requests. Generate 3 variations that are refinements of THIS
design, not completely new approaches.`
    : "";

  return `You are a UI/UX designer working on the ${repo.owner}/${repo.name} codebase.

## Your Task
Read the codebase to understand the existing design system, then generate 3 React component variations based on the user's request.

## Steps
1. Read CLAUDE.md to understand the project
2. Read the Tailwind config and globals.css to understand the design tokens
3. Read existing components to understand STYLE PATTERNS (spacing, layout, visual language) — your output runs in isolation, so recreate patterns using plain JSX + Tailwind, no project imports
4. Generate 3 distinct, interactive React component variations

## Variation Strategies
- Design A: Clean/conventional — prioritize clarity, familiar patterns, and straightforward navigation
- Design B: Creative/bold — unconventional layout, striking visual hierarchy, or unique interaction patterns
- Design C: Compact/efficient — high information density, minimal chrome, space-efficient UI

## Design System
The project uses a custom Tailwind config with CSS variables. Your components will be rendered in an environment that already provides these — just use the utility classes:

**Colors:** bg-background, bg-foreground, bg-primary, bg-secondary, bg-muted, bg-accent, bg-card, bg-destructive, bg-success, bg-warning (and text-* equivalents, plus text-primary-foreground etc.)
**Border:** border-border, border-input
**Radius:** rounded-sm (12px), rounded-md (14px), rounded-lg (16px)
**Font:** font-sans (Inter is loaded automatically)

CRITICAL: Use ONLY these semantic color utilities. NEVER use raw Tailwind colors like bg-blue-500, text-gray-700, bg-teal-600. Always use bg-primary, text-muted-foreground, etc.

## Design Quality Guidelines
- Use realistic content (real names, dates, numbers) — never "Lorem ipsum", "Item 1", or "User 1"
- Clear visual hierarchy: one primary action per view, secondary actions de-emphasized
- Consistent spacing using multiples of 4px via Tailwind: p-2, p-4, p-6, p-8
- Group related elements with cards (bg-card rounded-lg border border-border) or bordered sections
- Use whitespace generously — don't crowd elements together
- Responsive-first: use max-w-* containers, flex/grid layouts

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
- DO NOT modify any files in the codebase
- Output ONLY the JSON, no other text`;
}
