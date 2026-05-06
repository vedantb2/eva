# Per-repo `backgroundCommands` for sandbox previews

## Context

Long-running daemons like `npx convex dev` need to run alongside the dev server in preview sandboxes (sessions + quick-task previews) so code changes are picked up. Existing `startupCommands` use blocking `exec()` — a daemon hangs the loop and times out at 10 min. We need a separate channel that launches commands detached, survives no agent involvement, and respawns on resume (since processes die when a sandbox stops).

## Approach

Add `backgroundCommands: v.optional(v.array(v.string()))` on `githubRepos`. Launch each via the same `cmd > /tmp/<slug>.log 2>&1 &` pattern the dev server already uses. Runs on every sandbox start path, including resume. No marker-file gate.

## Files to modify

### Schema / config

- `packages/backend/convex/validators.ts` — add `backgroundCommands` to `githubRepoFields` next to `startupCommands` (line ~750).
- `packages/backend/convex/_githubRepos/mutations.ts` — extend `updateConfig` args + patch (mirror `startupCommands`).
- `packages/backend/convex/repoSnapshots.ts` — add `getBackgroundCommands` internal query (mirror `getStartupCommands` at line 492).

### Execution

- `packages/backend/convex/_daytona/execution.ts` — new `runBackgroundCommands` internalAction (mirror `runStartupCommands` at line 81). Differences:
  - For each cmd, run `nohup bash -lc '<cmd>' > /tmp/bg-<idx>.log 2>&1 &` with short exec timeout (e.g. 10s) — we only wait for the shell to fork, not the daemon to finish.
  - **No** `.startup-commands-done` marker — always run.
- `packages/backend/convex/_daytona/sessions.ts` — invoke `runBackgroundCommands` immediately after each `${devCommand} > /tmp/devserver.log 2>&1 &` site (lines 826, 869, and any other dev-launch site in this file). Also invoke on the first-start path that already calls `runStartupCommands` (line ~651) so both paths cover sessions, design sessions, projects, and task previews.
- `packages/backend/convex/_agentTasks/sandbox.ts` — confirm task-preview path goes through the shared `prepareSessionSandboxInternal()` so it inherits the change; if it has its own dev-launch site, add the invocation there too.

### UI

- `apps/web/src/routes/_repo/$owner/$repo/settings/AppClient.tsx` — add a second textarea below the existing `startupCommands` one bound to `backgroundCommands`. Reuse `parseCommandLines` and the same blur-to-save pattern (lines 14, 39–44, 98–104). Placeholder example: `npx convex dev`.

## Reuse

- `parseCommandLines` (settings AppClient) — already splits textarea lines.
- `exec()` from `_daytona/helpers.ts` — same shell exec used everywhere.
- `signAndLaunchScript` — not needed; this is fire-and-forget shell, not a tracked workflow.
- Dev-server launch idiom `cmd > /tmp/x.log 2>&1 &` — copy verbatim.

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` — no type errors.
2. In repo settings UI, add `npx convex dev` to the new textarea, save.
3. Start a session preview on that repo. SSH into sandbox: `cat /tmp/bg-0.log` should show convex dev output; `pgrep -f "convex dev"` returns a pid.
4. Edit a Convex function in the session, hit save in preview — change reflects without manual deploy.
5. Stop the sandbox, resume it. Confirm `pgrep -f "convex dev"` returns a new pid (re-spawned, not the old one).
6. Quick task preview path: trigger a quick task on the repo, confirm the daemon runs there too.
7. Empty `backgroundCommands` (default) — preview behaves exactly as before, no extra exec calls visible in logs.

## Open questions

- Do `npx convex dev` and similar daemons need extra env vars (e.g. `CONVEX_DEPLOY_KEY`) injected into the sandbox? If so, where do per-repo secrets currently live? Worth confirming before users hit it.
