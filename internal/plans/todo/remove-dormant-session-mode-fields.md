# Remove dormant session-mode fields

**Status:** ready to implement
**Written:** 22 August 2026
**Follows:** the modes-to-skills migration (see `internal/changelog.md`, "Session modes give way to the eva-plan and eva-design skills")

## Why

The session mode system (edit / plan / design) has been removed. Plan and design are now Eva system skills (`eva-plan`, `eva-design`), and post-turn effects are keyed on content rather than on a stored mode.

The stored fields that supported modes were deliberately left in place. They are optional and no longer read or written, so existing rows still validate and nothing is broken. This plan removes them.

This is debt removal, not a fix. There is no user-visible change and no deadline. The value is that the schema stops advertising a system that no longer exists, and the "pending a cleanup migration" comments stop becoming archaeology.

## Fields to remove

| Table            | Field                                     |
| ---------------- | ----------------------------------------- |
| `sessions`       | `lastMode`, `selectedVariationIndex`      |
| `messages`       | `mode`, `personaId`                       |
| `queuedMessages` | `mode`, `personaId`, `numDesigns`         |

Then:

- `sessionModeValidator` in `_validators/enums.ts` — its only remaining consumers are the three `mode` fields above.
- The `designPersonas` table in `schema.ts` — must go **after** the two `personaId` fields, because `v.optional(v.id("designPersonas"))` references it.

Adjacent freebie, unrelated to modes but carrying the same marker: `pendingTurn.turnKind` in `_validators/tableFields.ts` (line ~166) is also legacy and no longer written. Fold it into the same pass.

## Order of work

The order matters. Convex validates stored documents against the current validators on read, so removing a validator before the data is clean makes list queries fail on any deployment that still holds the old column.

### Deploy 1 — strip the data

Add `_migrations/removeSessionModeFields.ts` and export it from `migrations.ts`. Deploy with all validators still in place, then run it on every deployment (dev and prod).

### Deploy 2 — remove the validators

Once the migration has run everywhere:

1. Delete the seven fields from `_validators/tableFields.ts`.
2. Delete `sessionModeValidator` from `_validators/enums.ts` and its import in `tableFields.ts`.
3. Drop the `designPersonas` table from `schema.ts`, and with it:
   - the `"designPersonas"` entry in the cascade table list in `_migrations/deleteRepos.ts` (line ~262)
   - the `designPersonas` query in `repoUtils.ts` (line ~29)
4. Delete `_migrations/sessionModes.ts` and its export in `migrations.ts`. It normalised legacy `"ask"` / `"execute"` values into `"edit"`, which is meaningless once `mode` is gone.
5. Delete `_migrations/removeSessionModeFields.ts` and its export, per the house convention for spent migrations.

## Writing the migration

Follow the precedent in `_migrations/removeSnapshotWarmupFields.ts` rather than `removeSessionStartupRequestedAt.ts`.

Both strip a field by serialising the document, omitting the key, and calling `ctx.db.replace`. Convex will not let you patch a field out once it has left the validator, so the replace-with-omitted-key approach is required. The difference is scale: the sessions precedent uses `.collect()` on the whole table, which is fine for sessions but not for `messages` or `queuedMessages`. Those are high-volume and message content can be large, so a bulk collect risks exceeding the per-function read limit.

Therefore:

- `sessions` — a single pass is acceptable, but paginate anyway for consistency.
- `messages` and `queuedMessages` — paginate with a cursor and reschedule via `ctx.scheduler.runAfter(0, ...)` when `page.isDone` is false, exactly as `removeSnapshotWarmupFields` does.
- Skip documents that carry none of the target fields, so a re-run is cheap and idempotent.
- Log per-table counts and return `{ done: boolean }` so progress is visible across the scheduled chain.

House rules apply: no `any`, `unknown`, `as`, or non-null assertions. The precedents type the legacy shape as an explicit intersection (for example `Doc<"messages"> & LegacyMessageJson`) and discard the omitted keys with `void`, which satisfies this.

## Risk

Low. The fields are already write-dead, so there is no race between the migration and live traffic: a document cleaned mid-flight will not have the field written back.

One caveat that belongs to the original migration rather than this one, but which is worth recording: `sessionExecuteWorkflow`'s argument validator changed when modes were removed, so any workflow in flight at that deploy fails argument validation on resume. Deploy when sessions are idle, or accept that a few turns die and users resend them. This plan does not touch the workflow, so it does not repeat that risk.

## Verify

- `cd packages/backend && npx convex codegen --typecheck enable`
- `cd apps/web && npx tsc --noEmit`
- `cd packages/backend && npx vitest run`
- Grep gate after Deploy 2: `lastMode|selectedVariationIndex|designPersonas|numDesigns|personaId|sessionModeValidator|turnKind` returns nothing outside `_generated/` and `internal/` markdown.
- Open a session that predates the change and confirm the list and detail views still load, which exercises the stored-document validation that this plan is about.

## Unresolved

None.
