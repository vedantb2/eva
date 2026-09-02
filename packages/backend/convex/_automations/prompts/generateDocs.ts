/** Prompt for the `generate-docs` catalog entry. */
export const GENERATE_DOCS_PROMPT = `## Goal

Keep technical documentation current and useful as the codebase evolves.

## What to document

- Recently changed subsystems with weak docs.
- Public interfaces, workflows, and operational runbooks.
- Setup, troubleshooting, and common pitfalls for developers.

## Documentation standards

- Explain intent, architecture, and usage.
- Include concrete examples and constraints.
- Keep docs concise and structured for scanning.
- Align with existing docs style and location.

## Guardrails

- Do not fabricate behavior; verify against source code.
- Prefer updating existing docs over creating redundant pages.
- Keep documentation-only PRs clean and focused.

## Output

If you open a PR, summarize:
- Docs added/updated
- Which codepaths they cover
- Key knowledge gaps addressed`;
