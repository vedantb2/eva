# Cleanup: remove legacy `pendingTurn.turnKind` field

Status: TODO (deliberately deferred from PR #500, merged 28 Jul 2026)

## Background

PR #500 (`fix(sessions): full-context turns and interrupt-based cancel`) removed the
conversational fast path: `classifyTurnKind` is gone and nothing writes
`pendingTurn.turnKind` anymore. The validator was kept **optional** so existing prod
documents that still carry the field keep validating:

- `packages/backend/convex/_validators/tableFields.ts` → `pendingTurnFields.turnKind`
  (`v.optional(v.union(v.literal("conversational"), v.literal("agent")))`, marked
  `// legacy field, no longer written — cleanup migration later`).

`pendingTurn` is embedded via `chatDaemonEntityFields` into three tables:
`agentTasks`, `sessions`, and `projects`.

Note: `pendingTurn` is transient — it is staged on send and cleared when the daemon
claims it (`claimPendingTurn` patches it to `undefined`) or on cancel/completion. So
only stranded/stale documents can still hold a `turnKind` value; the count is likely
zero or near-zero by the time this runs.

## Cleanup steps (repo migration procedure — CLAUDE.md)

1. **Add the migration** in `packages/backend/convex/_migrations/` (follow the
   pattern of `removeSessionStartupRequestedAt.ts` / `removeSnapshotWarmupFields.ts`)
   and re-export it from `convex/migrations.ts`. For each of `agentTasks`,
   `sessions`, `projects`: find docs where `pendingTurn` is set and
   `pendingTurn.turnKind !== undefined`, and patch `pendingTurn` to the same object
   without the `turnKind` key. (Alternatively: since any surviving `pendingTurn` is
   stale by definition, clearing the whole `pendingTurn` to `undefined` is also
   defensible — decide at implementation time.)
2. **Deploy**, then **run the migration** against prod (and dev if it has old data).
3. **Remove the field**: delete `turnKind` from `pendingTurnFields` in
   `tableFields.ts` and run `npx convex codegen --typecheck enable` — the push will
   fail schema validation if any doc still carries the field, which is the safety
   net for step 2.
4. **Delete the migration function** and its export (repo convention: migrations are
   cleaned up after they have run).

## Also safe to sweep at the same time

- `packages/backend/tests/sessionBackgroundAgents.test.ts` has an inert
  `turnKind: "agent"` in a mock claim payload (the consuming code only reads
  `stopTaskToolUseIds`). Drop the key when touching that test.
- Old daemons tolerate the field's absence in claim responses (`readClaimedTurn`
  defaulted missing `turnKind` to `agent` even before #500), so there is no
  callback-script coupling to worry about.
