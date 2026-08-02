# Auto-tag quick tasks with gpt-5-nano

**Status:** implemented (2026-08-02, `943f282c`)

## Context

Tasks already have a `tags` field, badges, filtering, bulk-edit and a composer tag picker — but nothing ever fills tags in automatically. Users skip tagging, so the filters stay empty.

Add background tag generation on task creation, reusing the exact pattern already proven by session-title generation: schedule an internal Node action from the create mutation → call `openai/gpt-5-nano` through the AI Gateway → write back through a guarded internal mutation.

No new env vars. `AI_GATEWAY_API_KEY` is already required by `textGen.ts` and read implicitly by the `ai` SDK's default gateway provider.

## Decisions (locked)

| Decision         | Choice                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vocabulary       | Fixed allow-list, expanded to 22 tags. Off-list output discarded.                                                                                        |
| Paths            | `createQuickTask` + `activateDraft` only. (Covers the modal, project tasks, MCP `create_task`, Chrome extension — all funnel through `createQuickTask`.) |
| User-picked tags | Always generate. Merge **after** the user's tags. Max **3 generated**, no cap on the task total.                                                         |
| Model input      | **Title + description** (description truncated to 2000 chars; `(none)` when empty).                                                                      |
| Picker seed      | Union `TASK_TAGS` into `allTags` in QuickTasksClient + ProjectActiveLayout.                                                                              |
| Unit tests       | `packages/backend/tests/taskTagParsing.test.ts` importing from `@eva/shared` (no vitest in shared).                                                      |
| Defense in depth | `applyGeneratedTags` re-runs `parseGeneratedTags` so a bad action payload cannot write junk.                                                             |

## Vocabulary

Grouped for the prompt only; validation uses the flat union.

- **Type** — bug, feature, refactor, docs, testing, chore, migration
- **Quality** — performance, security, accessibility, reliability, design, ux
- **Area** — frontend, backend, database, infra, ci, auth, dependencies, config, integration

---

## Step 1 — `packages/shared/src/taskTags.ts`

Holds the vocabulary and the parser together — pure, no Convex imports, unit-testable.

- `TASK_TAGS`, `MAX_GENERATED_TAGS = 3`, `parseGeneratedTags(raw, alreadyApplied)`
- Parser: lowercase, split on `,` / newline, strip wrapping quotes/backticks, reject off-list / already-applied (case-insensitive) / dupes, stop at 3
- Re-exported from `packages/shared/src/index.ts`

## Step 2 — `generateTaskTags` in `packages/backend/convex/textGen.ts`

Internal action after `generateSessionTitle`, mirroring its shape.

- Args: `taskId`, `title`, `description?`, `existingTags`
- Model: `TEXT_GEN_MODEL` (`openai/gpt-5-nano`)
- `providerOptions`: `gateway.serviceTier: "flex"` + `openai.reasoningEffort: "minimal"` / `textVerbosity: "low"`
- No `maxOutputTokens` (same lesson as session titles)
- Silent `try/catch` + `console.error("[textGen.generateTaskTags]", …)`
- On success → `internal.agentTasks.applyGeneratedTags`

## Step 3 — `applyGeneratedTags` in `packages/backend/convex/_agentTasks/internal.ts`

Guarded write-back: re-read current tags, re-parse suggestions against vocabulary + current tags, merge via `normalizeTaskTags` (user tags first), skip if nothing new. Exported from `agentTasks.ts`.

## Step 4–5 — schedule

- `createQuickTask` — after `ensureSubscribed`
- `activateDraft` — after the promote `patch`

## Step 6 — seed picker

`TASK_TAGS` unioned into `allTags` in:

- `apps/web/.../quick-tasks/QuickTasksClient.tsx`
- `apps/web/.../projects/ProjectActiveLayout.tsx`

## Assumptions

- No task-activity log entry for generated tags
- Batch paths untouched (`createQuickTasksBatch`, automation findings, etc.)
- Missing `AI_GATEWAY_API_KEY` → tags silently never appear (same as session titles)
