# AI guidance changelog

## 2026-05-22

- Removed the sandbox `CLAUDE_SHELL_TOOL_TIMEOUT_MS=240000` cap; shell tools fall back to the callback default (~49 min) until the heartbeat watchdog kills the run. Task and automation prompts no longer mention a 240s shell kill limit.

## 2026-05-21

- Finished migrating remaining `icon.png` references to `icon.svg` in shared UI (`packages/ui`), chrome extension sidepanel, and MCP server metadata. Chrome extension manifest still uses PNG for toolbar icons (MV3 requirement).
- Claude custom connectors ignore MCP `serverInfo.icons` and use Google faviconV2 on the MCP server hostname. Regional `*.eu-west-1.convex.site` URLs are stripped to `eu-west-1.convex.site` (invalid) — use a Convex custom domain for MCP. Also serve PNG favicons on Convex HTTP + web app, OAuth `logo_uri`, and `robots.txt`.

## 2026-05-20

- Automation settings model picker now uses the current repo’s env vars and repo default model, and provider submenus work inside scrollable settings (same as Config/tasks).
- Archived sandbox restore timeout increased from 5 to 10 minutes for session/task/project reuse.
- Audit fix runs use typecheck instead of full build, and Eva publishes the branch after success instead of having the agent push.
- Automation runs use per-run branch names (`eva/automation-{automationId}-{runId}`) so each run opens a fresh PR instead of updating one shared branch.
- Write-mode automations require a new git commit before success (same gate as tasks), preventing PR failures when the branch is not ahead of the base.
- Removed `apps/mobile`, `apps/desktop`, and `apps/teams-bot` from the monorepo; active clients are web and chrome-extension only.

## 2026-05-11

- Repo Settings → Snapshots tabs are URL-backed (`…/snapshots/configuration|status|builds|config-files`); `/snapshots` redirects to `configuration`.
- Projects sidebar badge now mirrors Quick Tasks: hover popover with separate Building and Sandbox sections linking to each project, backed by new `projects.getActive` query.
- "Run Eva on this task" is hidden for project tasks in both the task card menu (context + dropdown) and the task detail footer — project tasks run via the project build workflow, not individually.
- Implementation-mode agent Summary prompt now asks the agent to name impacted user-facing routes in its prose summary (or explicitly say none), so the run summary / PR body tells reviewers where to look.

## 2026-04-14

- Added `project-structure.md` with a short repo map; session sandbox panel supports multiple terminal panes via URL state and optional Convex `ptyInstanceId`.
