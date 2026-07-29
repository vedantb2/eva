# Follow-ups after removing the `claude -p` CLI spawn path

Context: as of 2026-07-25 the callback runs Claude only via
`@anthropic-ai/claude-agent-sdk`. `CLAUDE_ATTEMPT_MODE` accepts `sdk`
(one-shot `query()` per turn) or `sdk-daemon` (persistent warm session,
the default when unset). The `cli` value no longer exists — an old deployment
env var set to `cli` would now silently behave as an unrecognized value with
the daemon gates off, so clean these up promptly.

## Env vars to clean up

- [ ] **Unset `CLAUDE_ATTEMPT_MODE` on Convex deployments** (prod and
      dev `good-mule-506`). Check with `npx convex env list` on each. Unset now
      means `sdk-daemon`, which is the desired production shape. Only keep it
      if a deployment deliberately wants one-shot `sdk` mode. Anything still
      set to `cli` or `sdk` from the migration soak should be removed.
- [ ] After all deployments are unset, consider **deleting the
      `CLAUDE_ATTEMPT_MODE` env var entirely** (drop the `sdk` one-shot mode,
      keep the one-shot SDK runner only as the internal non-session /
      daemon-fallback path). Touchpoints: - `callback-src/config.ts` (`CLAUDE_ATTEMPT_MODE` const) - `callback-src/index.ts` (daemon entry gate) - `callback-src/runtime/pendingQuestion.ts` (`Agent`/`Task`
      run_in_background force-foreground gate is skipped in daemon mode) - `callback-src/tests/pendingQuestion.test.ts` (sets the env var) - `convex/_sandbox_runtime/launch.ts` (env forwarding block) - `convex/_sandbox_runtime/execution.ts` (prewarm guard)

## Env vars checked and still needed (do not remove)

- `CLAUDE_BIN_PATH` — the SDK does not bundle a CLI; it spawns the
  `claude` executable via `pathToClaudeCodeExecutable`
  (`claudeSdk.ts` -> `claudeExecutablePath()`, which prefers `claude` on
  PATH and falls back to this path when the global install is missing). Keep.
- `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` in `launch.ts` — still applies to
  the SDK-spawned executable. Keep.
- Global `npm install -g @anthropic-ai/claude-code` in the snapshot image —
  this is the executable the SDK drives. Keep.

## Transitional concerns

- [ ] Old sandboxes still running the previous callback bundle default to the
      removed `cli` mode. The `CALLBACK_SCRIPT_FP` fingerprint check makes
      stale daemons exit and the launcher re-uploads the new bundle, so this
      should self-heal on the next turn — verify a pre-deploy session resumes
      cleanly after the deploy.

## Doc cleanup

- [ ] `plan-migrate-claude-runtime-to-agent-sdk-persistent-bridge-server.md`
      at the repo root still describes the CLI-era architecture — archive it
      into `internal/plans/implemented/` or delete it.
- [ ] Grep for remaining `claude -p` mentions in `internal/` docs and prune
      as they are touched (historical plan/changelog mentions are fine).
