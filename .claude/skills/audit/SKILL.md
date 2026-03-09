---
name: audit
description: Post-commit code audit router. Reviews git diff and conditionally invokes accessibility, code review, and testing audits. Produces structured JSON output matching the evalResultValidator schema. Use after committing changes.
---

# Audit Router

You are a post-commit code auditor. Follow these steps in order:

## Step 1: Get the diff

Run `git diff HEAD~1..HEAD` to get the latest commit's changes. If that fails, run `git diff --cached` or `git diff` to get staged/unstaged changes.

Store the diff for use in subsequent steps.

## Step 2: Classify changes

Analyze the diff and classify what types of files were changed:

- **hasFrontendChanges**: `.tsx`, `.jsx`, `.css`, `.scss` files with UI/component code
- **hasMultipleFiles**: more than 2 files were edited
- **hasBigComponents**: any single file diff adds 100+ lines to a component

## Step 3: Run applicable audits

Invoke the following skills sequentially using the Skill tool. Before each invocation, paste the git diff into the conversation so the sub-skill has context.

### Always run:

- `/audit-code-review` — code style, correctness, security

### Conditional:

- `/audit-accessibility` — only if `hasFrontendChanges` is true
- `/audit-testing` — only if `hasMultipleFiles` is true

For sections that were skipped, use this default result:

```json
[
  {
    "requirement": "Not applicable",
    "passed": true,
    "detail": "No relevant changes detected"
  }
]
```

## Step 4: Combine results

After all sub-skills complete, combine their outputs into a single JSON block using the flexible `sections` format:

```json
{
  "sections": [
    {
      "name": "Accessibility",
      "results": [{ "requirement": "...", "passed": true, "detail": "..." }]
    },
    {
      "name": "Testing",
      "results": [{ "requirement": "...", "passed": true, "detail": "..." }]
    },
    {
      "name": "Code Review",
      "results": [{ "requirement": "...", "passed": true, "detail": "..." }]
    }
  ],
  "summary": "1-2 sentence overall assessment"
}
```

Only include sections that were actually run. The section `name` field is a human-readable label. New audit categories can be added without schema changes.

Output this JSON block clearly.

## Step 5: Auto-simplify

If `hasBigComponents` is true, invoke `/simplify` on the flagged components.

## Step 6: Commit fixes

If `/simplify` or any audit sub-skill made code changes, stage and commit them with the message:

```
audit: <brief description of what was fixed>
```

Use the HEREDOC format for the commit message. Do NOT amend the previous commit.

## Quick Navigation

You can run individual audits directly:

- `/audit-accessibility` - WCAG and accessibility checks
- `/audit-code-review` - Code style, correctness, security
- `/audit-testing` - Test coverage analysis
