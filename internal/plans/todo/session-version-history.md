# Session Version History (v0-style)

## Context

Each session execute currently overwrites `session.fileDiffs` with the latest diffs — there's no way to see what changed per edit or revert to a prior state. We want v0-style version history: each execute = new version, dropdown to browse/revert.

## Files to Modify/Create

| File                                                               | Action                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `packages/backend/convex/schema.ts`                                | Add `sessionVersions` table, add `currentVersion` to `sessions`    |
| `packages/backend/convex/sessions.ts`                              | Add `currentVersion` to `sessionValidator`                         |
| `packages/backend/convex/sessionVersions.ts`                       | **Create** — list, create, deleteAfter                             |
| `apps/web/lib/inngest/functions/session-execute.ts`                | Capture `afterHead`, create version in save-diffs step             |
| `apps/web/lib/inngest/functions/session-revert.ts`                 | **Create** — Inngest function for sandbox git reset                |
| `apps/web/lib/inngest/index.ts`                                    | Export `sessionRevert`                                             |
| `apps/web/app/api/inngest/route.ts`                                | Register `sessionRevert`                                           |
| `apps/web/app/(main)/[repo]/sessions/[id]/DiffPanel.tsx`           | Add version dropdown + revert button                               |
| `apps/web/app/(main)/[repo]/sessions/[id]/SandboxPanel.tsx`        | Pass `sessionId`, `currentVersion`, `isSandboxActive` to DiffPanel |
| `apps/web/app/(main)/[repo]/sessions/[id]/SessionDetailClient.tsx` | Pass `currentVersion` to SandboxPanel                              |

## Implementation Steps

### 1. Schema — `packages/backend/convex/schema.ts`

Add `currentVersion: v.optional(v.number())` to the `sessions` table (after `planContent` on line 191).

Add new `sessionVersions` table after `sessions`:

```
sessionVersions: defineTable({
  sessionId: v.id("sessions"),
  version: v.number(),
  description: v.string(),
  commitSha: v.string(),
  fileDiffs: v.array(v.object({
    file: v.string(),
    status: v.string(),
    diff: v.string(),
  })),
  createdAt: v.number(),
})
  .index("by_session", ["sessionId"]),
```

### 2. Session validator — `packages/backend/convex/sessions.ts`

Add `currentVersion: v.optional(v.number())` to `sessionValidator` (line ~42).

### 3. Convex functions — `packages/backend/convex/sessionVersions.ts` (new)

- `list({ sessionId })` — query all versions by session, return sorted by version
- `create({ sessionId, version, description, commitSha, fileDiffs })` — insert version doc + patch `session.currentVersion`
- `deleteAfter({ sessionId, version })` — delete all versions with `version > target`, patch session's `currentVersion` and `fileDiffs` to match target version

### 4. Capture versions — `apps/web/lib/inngest/functions/session-execute.ts`

In the execute mode's "execute-task" step (around line 414), after Claude finishes, capture `afterHead`:

```ts
const afterHeadResult = await sandbox.process.executeCommand(
  `cd ${WORKSPACE_DIR} && git rev-parse HEAD`,
  "/",
  undefined,
  10,
);
const afterHead = (afterHeadResult.result || "").trim();
```

Return `afterHead` alongside existing `beforeHead`, `summary`, `activityLog`, `sandboxId`.

In the "save-diffs" step (line 424), after storing diffs, create a version:

```ts
const existingVersions = await convex.query(api.sessionVersions.list, {
  sessionId: sessionId as Id<"sessions">,
});
const nextVersion =
  existingVersions.length > 0
    ? Math.max(...existingVersions.map((v) => v.version)) + 1
    : 1;
await convex.mutation(api.sessionVersions.create, {
  sessionId: sessionId as Id<"sessions">,
  version: nextVersion,
  description: message.slice(0, 80),
  commitSha: result.afterHead || result.beforeHead,
  fileDiffs: diffs,
});
```

### 5. Revert function — `apps/web/lib/inngest/functions/session-revert.ts` (new)

New Inngest function listening to `session/revert` event. Steps:

1. Fetch session + repo data (same pattern as session-execute)
2. Get sandbox, run `git reset --hard <commitSha>` + `git push --force origin <branch>`
3. Call `sessionVersions.deleteAfter` to remove later versions and update session state

Export from `apps/web/lib/inngest/index.ts` and register in `apps/web/app/api/inngest/route.ts`.

### 6. UI — DiffPanel version dropdown

Expand `DiffPanel` props to accept `sessionId`, `currentVersion`, and `isSandboxActive`.

Inside DiffPanel:

- `useQuery(api.sessionVersions.list, { sessionId })` to fetch versions
- `useState` for `selectedVersion` (defaults to `currentVersion` or latest)
- Render a `Select` dropdown in the header bar (next to `tabSwitcher`) showing versions as `v1 — description`, `v2 — description`, etc.
- When a non-current version is selected, override `fileDiffs` with that version's stored diffs
- Show a "Revert to this version" button when viewing an older version (disabled when `!isSandboxActive`)
- Revert calls `fetch("/api/inngest/send", ...)` with `session/revert` event

### 7. Prop threading

**SandboxPanel** — add `currentVersion` and `isSandboxActive` to props, pass `sessionId`, `currentVersion`, and `isSandboxActive` to `DiffPanel`:

```tsx
<DiffPanel
  fileDiffs={fileDiffs}
  tabSwitcher={tabSwitcher}
  sessionId={sessionId}
  currentVersion={currentVersion}
  isSandboxActive={isActive}
/>
```

**SessionDetailClient** — pass `currentVersion={session.currentVersion}` to SandboxPanel.

## Revert Behavior

- Messages are **kept** on revert (conversation history preserved)
- Only code state and version history change
- Versions after the revert point are deleted
- New executions after revert continue with incrementing version numbers

## Edge Cases

- **Existing sessions** (no versions yet): dropdown hidden, shows `fileDiffs` as before
- **ask/plan modes**: no version created (only execute creates versions)
- **No diffs produced**: no version created (existing behavior — `diffs.length > 0` guard)
- **Sandbox inactive**: revert button disabled
- **Force push safety**: session branches are isolated (`session/<id>`)

## Verification

1. Run `npx tsc` in `apps/web` for type checking
2. Test: create a session, run 2-3 executes → versions appear in dropdown
3. Test: select older version → DiffPanel shows that version's diffs
4. Test: click revert → sandbox resets, later versions removed, new edits continue from reverted point
