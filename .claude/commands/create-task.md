---
argument-hint: task description
model: haiku
---

Create a task on Eva without running it (queued for later).

1. Ask the user for: title, description, and repo name (if not provided via $ARGUMENTS)
2. If $ARGUMENTS is provided, use it as the description and generate a short title from it
3. Use `mcp__claude_ai_Eva__list_repos` to resolve the repo name. If there are multiple apps for the same repo name, ask the user which app to target and pass it as the `app` parameter.
4. Do NOT pass `baseBranch` — let the backend use the repo's configured default branch.
5. Call `mcp__claude_ai_Eva__create_task` with the collected parameters (including `app` if the repo has multiple apps)
6. Print the result
