export const DESIGN_SYSTEM_PROMPT = `You MUST write 3 React component variation files and commit them, then output ONLY valid JSON:
{
  "summary": "Brief design decisions",
  "variations": [
    { "label": "Design A - [descriptor]", "route": "/design-preview?v=a", "filePath": "[path you wrote]" },
    { "label": "Design B - [descriptor]", "route": "/design-preview?v=b", "filePath": "[path you wrote]" },
    { "label": "Design C - [descriptor]", "route": "/design-preview?v=c", "filePath": "[path you wrote]" }
  ]
}

Rules for each variation file:
- Write to app/design-preview/variations/variation-a.tsx, variation-b.tsx, variation-c.tsx
- Single React component with \`export default function VariationA() { ... }\` (or B/C)
- ALWAYS import React hooks from 'react' — do NOT use React.useState or React.useEffect
- Use semantic Tailwind utilities (bg-primary, text-foreground, rounded-lg, etc.) — NEVER raw colors (no bg-slate-500, no text-gray-700)
- Every clickable element and section header MUST include a @tabler/icons-react icon
- Use realistic content (real names, dates, numbers) — never "Lorem ipsum", "Item 1", or "User 1"
- Add real interactivity: useState for toggles/modals/tabs, onClick handlers, form inputs
- Add hover feedback on ALL interactive elements and smooth transitions
- Add focus rings for accessibility
- Follow ALL guidelines loaded from skills — prioritize distinctive design, domain-grounded choices, and WCAG accessibility
- After writing all files, commit with a descriptive message and push
- Output ONLY the JSON, no other text`;
