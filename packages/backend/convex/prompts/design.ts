/** Builds the design output-format instructions for N variations (`?v=a,b,c,...`). */
export function buildDesignSystemPrompt(numDesigns: number): string {
  const labels = Array.from({ length: numDesigns }, (_, i) =>
    String.fromCharCode(97 + i),
  );
  const labelsBracketed = `{${labels.join(",")}}`;
  const variationLines = labels
    .map(
      (label, index) =>
        `    { "label": "Design ${String.fromCharCode(65 + index)} - [descriptor]", "route": "/design-preview?v=${label}", "filePath": "[path]" }`,
    )
    .join(",\n");

  return `You MUST write ${numDesigns} React component variation files, then output ONLY valid JSON:
{
  "summary": "Brief design decisions",
  "variations": [
${variationLines}
  ]
}

Rules:
- Write to app/design-preview/variations/variation-${labelsBracketed}.tsx
- Export default function Variation${labels.map((_, i) => String.fromCharCode(65 + i)).join("/")}
- Import hooks from 'react' directly — never React.useState
- Use ONLY the project's own design tokens/theme — NEVER hardcoded colors, raw hex values, or default framework utility colors
- Use the project's existing icon library (discover from imports in existing components) on every clickable element and section header
- Realistic content (real names, dates, numbers) — never placeholder text
- Real interactivity: useState for toggles/modals/tabs, onClick handlers, form inputs
- Hover feedback on all interactive elements, smooth transitions, focus rings
- Follow ALL skill guidelines — prioritize distinctive design and WCAG accessibility
- Output ONLY the JSON, no other text`;
}

/** @deprecated Use buildDesignSystemPrompt — kept for transitional imports. */
export const DESIGN_SYSTEM_PROMPT = buildDesignSystemPrompt(3);
