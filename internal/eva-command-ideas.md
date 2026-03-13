# Eva MCP Command Ideas

## Already Created

- `/create-task` — queue a task on Eva for later
- `/run-task` — create and immediately run a task on Eva

## High Value

- `/query-db` — natural language DB explorer. Chains list_repos → pick repo → list_tables → ask question → run_query. Conversational wrapper around multiple MCP calls.
- `/check-task` — query recent tasks, show status/progress. Quick "what's running on Eva right now" view.
- `/review-eva` — after Eva finishes a task, pull up what it did: query task → find branch/PR → run code-review on it. Chains the whole review flow.
- `/retry-task` — query a failed/stuck task, inspect what went wrong, re-dispatch with same or tweaked description.
- `/explore-db` — interactive REPL-style DB exploration: pick repo → see tables → pick table → see schema + sample docs → follow-up queries. More open-ended than /query-db.
- `/task-summary` — morning command: show all tasks from last 24h grouped by status (running/completed/failed). Like /standup but for Eva's work.

## Medium Value

- `/bulk-run` — takes a plan with multiple independent steps, splits into separate tasks, dispatches all via create_and_run_task in parallel.
- `/db-schema` — quick shortcut for list_tables with nice formatting. Reference when writing queries.

## Low Value (skip)

- Wrappers around get_document or count_table — too simple
- list_repos wrapper — call once and remember
