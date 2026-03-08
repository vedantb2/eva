### Codex + Claude Dual-Provider Model Selection (Env-Var OAuth)

#### Summary

- Add provider-aware model support across the app so users can pick Claude models (Claude Code) or OpenAI models (Codex) in all model surfaces.
- Use `OPENAI_OAUTH_TOKEN` from repo/team env vars for Codex, mapped at runtime to `OPENAI_API_KEY` (no direct API-key setup flow).
- Make Codex models visible but disabled when token missing; add `OPENAI_OAUTH_TOKEN` as **required** in Setup Banner.
- Keep Codex streaming at basic status level for v1; preserve full Claude tool-step streaming.

#### Key Changes

- Model domain:

1. Replace Claude-only model typing with a unified model catalog and validator used by schema, workflows, and UI.
2. Keep existing Claude IDs (`opus`, `sonnet`, `haiku`) and add full Codex list: `gpt-5`, `gpt-5-codex`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-4.1`, `o4-mini`.
3. Add provider metadata per model (`claude` or `codex`) for routing and grouped selector rendering.

- Execution/runtime:

1. Extend sandbox launch/callback pipeline to route by provider:
2. Claude path unchanged (`claude-code` stream-json).
3. Codex path uses non-interactive `codex exec` with approval/sandbox flags; token sourced from env (`OPENAI_OAUTH_TOKEN` -> `OPENAI_API_KEY` in process env).
4. Add Codex process termination to cancel/kill flow.

- Env-var availability + gating:

1. Add backend “model availability for repo” query that merges team+repo env vars and marks model options enabled/disabled.
2. Disable Codex options with reason when `OPENAI_OAUTH_TOKEN` absent.
3. Add `OPENAI_OAUTH_TOKEN` to Setup Banner required keys.

- UI/model selectors (all requested surfaces):

1. Upgrade selector UX to provider-grouped options.
2. Wire availability-aware grouped model options into:
3. Session chat selector.
4. Research query selector.
5. Project chat selector (and implement real backend execution path so selector is functional).
6. Repo default model selector.
7. Task detail model selector.
8. Keep quick-task create behavior inherited from repo default model.

- Project chat full wiring:

1. Add project-chat execution workflow/mutations (assistant placeholder, sandbox execution, completion save, streaming) with selected model + response length.
2. Ensure selected model in Project chat directly controls run provider/model.

- Logs:

1. Extend log parsing fallback so model label still renders for Codex runs even when Claude-specific usage fields are absent.
2. Preserve existing cost/token display behavior; Codex can show unknown/zero until richer usage parsing is added.

#### Test Plan

1. Token present at team level only: Codex models enabled in every selector surface.
2. Token missing: Codex models visible but disabled with helper reason in every selector surface.
3. Session run with Codex model: completes, returns response, can be cancelled, logs show selected model.
4. Repo default set to Codex model + quick task run: task execution routes through Codex runner.
5. Task detail model switch to Codex then run: uses Codex path.
6. Research query generation with Codex model: executes successfully.
7. Project chat message run: uses selected model and streams basic status.
8. Claude regression: existing Claude runs keep detailed ActivitySteps and current behavior.

#### Assumptions

- `OPENAI_OAUTH_TOKEN` value is valid for Codex runtime when mapped to `OPENAI_API_KEY`.
- Codex v1 activity logging is intentionally basic (status-level), per your preference.
- Setup Banner should treat `OPENAI_OAUTH_TOKEN` as required globally.

#### Unresolved Questions

- None.
