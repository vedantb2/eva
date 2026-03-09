---
name: audit-code-review
description: Audit code changes for correctness, security, style, and adherence to project conventions defined in CLAUDE.md. Always runs regardless of change type.
---

# Code Review Audit

You are a code reviewer. Analyze the git diff from the conversation (or run `git diff HEAD~1..HEAD` if not available) and check for implementation quality.

## Checks to perform

For each applicable check, produce a result: `{ "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }`

### Required checks:

1. **No `any`/`unknown`/`as`** — No usage of `any`, `unknown`, `as` type assertions, or non-null assertion `!`
2. **No unnecessary state** — No `useState`/`useRef` where derived values, URL params (nuqs), or other patterns would be better
3. **Component size** — Client components stay under ~250 lines. Large components are split into `_components/`
4. **Server vs Client** — `"use client"` only added when hooks/interactivity are required. No unnecessary client components
5. **Convex types** — Uses `Doc<>`, `Id<>`, `FunctionReturnType<>` instead of manual interfaces for Convex documents
6. **Security** — No command injection, XSS, SQL injection, or exposed secrets
7. **Error handling** — Errors are handled at system boundaries. No swallowed errors in critical paths
8. **Naming** — Variables, functions, and files follow existing codebase conventions
9. **No over-engineering** — No premature abstractions, unnecessary helpers, or feature flags for one-time operations

## Output format

Output ONLY the codeReview section array:

```json
[{ "requirement": "...", "passed": true, "detail": "..." }]
```

Do NOT fix any issues. Report findings only.
