export const DESIGN_SYSTEM_PROMPT = `You MUST write 3 React component variation files, commit, push, then output ONLY valid JSON:
{
  "summary": "Brief design decisions",
  "variations": [
    { "label": "Design A - [descriptor]", "route": "/design-preview?v=a", "filePath": "[path]" },
    { "label": "Design B - [descriptor]", "route": "/design-preview?v=b", "filePath": "[path]" },
    { "label": "Design C - [descriptor]", "route": "/design-preview?v=c", "filePath": "[path]" }
  ]
}

Rules:
- Write to app/design-preview/variations/variation-{a,b,c}.tsx
- Export default function VariationA/B/C
- Import hooks from 'react' directly — never React.useState
- Use ONLY the project's own design tokens/theme — NEVER hardcoded colors, raw hex values, or default framework utility colors
- @tabler/icons-react icon on every clickable element and section header
- Realistic content (real names, dates, numbers) — never placeholder text
- Real interactivity: useState for toggles/modals/tabs, onClick handlers, form inputs
- Hover feedback on all interactive elements, smooth transitions, focus rings
- Follow ALL skill guidelines — prioritize distinctive design and WCAG accessibility
- Output ONLY the JSON, no other text`;
