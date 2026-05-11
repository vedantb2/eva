# AI guidance changelog

## 2026-05-11

- Projects sidebar badge now mirrors Quick Tasks: hover popover with separate Building and Sandbox sections linking to each project, backed by new `projects.getActive` query.
- "Run Eva on this task" is hidden for project tasks in both the task card menu (context + dropdown) and the task detail footer — project tasks run via the project build workflow, not individually.
- Implementation-mode agent Summary prompt now asks the agent to name impacted user-facing routes in its prose summary (or explicitly say none), so the run summary / PR body tells reviewers where to look.

## 2026-04-14

- Added `project-structure.md` with a short repo map; session sandbox panel supports multiple terminal panes via URL state and optional Convex `ptyInstanceId`.
