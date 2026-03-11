---
argument-hint: task description
model: haiku
---

Create a task on Eva and immediately start execution.

1. Ask the user for: title, description, and repo name (if not provided via $ARGUMENTS)
2. If $ARGUMENTS is provided, use it as the description and generate a short title from it
3. Use `mcp__claude_ai_Eva__list_repos` to resolve the repo name if ambiguous
4. Call `mcp__claude_ai_Eva__create_and_run_task` with the collected parameters
5. Print the result
