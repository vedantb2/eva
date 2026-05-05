# Snapshot Build Commands

## Context

Today the snapshot Dockerfile (built in `snapshotActions.ts → buildSnapshotImage`) is fully hardcoded: clone repo → download config files → `pnpm install`. There is no way for a user to add repo-specific setup that should be **baked into the snapshot image** (e.g. `pnpm convex codegen`, `pnpm build`, pre-warming a local cache, seeding a local SQLite DB before snapshot). The only existing customization point is `githubRepos.startupCommands`, which runs at **sandbox startup**, not during snapshot **build** — and therefore re-runs on every sandbox boot rather than being baked in once.

This plan adds a "Build Commands" section to the snapshots Configuration tab where users enter newline-delimited commands. Those commands are appended as Docker `RUN` steps **after** `pnpm install`, executing as user `eva` in `/tmp/repo`, baked permanently into the snapshot.

## Design Decisions (confirmed with user)

- **Position in Dockerfile**: after `pnpm install` (repo + node_modules available).
- **User**: `eva` (current Dockerfile state already has `USER eva` set).
- **UI placement**: new card in the existing Configuration tab, below Clone Branch.
- **Parsing**: one command per line, each becomes its own `image.runCommands(...)` call (one Docker layer per command — preserves caching).

## Files to modify

### 1. `packages/backend/convex/schema.ts`

Add `buildCommands` to the `repoSnapshots` table:

```ts
repoSnapshots: defineTable({
  // ...existing fields...
  buildCommands: v.optional(v.array(v.string())),
});
```

### 2. `packages/backend/convex/repoSnapshots.ts`

- Add `buildCommands: v.optional(v.array(v.string()))` to the return validator of `getRepoSnapshot` (lines ~31–43) and `getRepoSnapshotInternal` (find & update similarly).
- Extend `saveRepoSnapshot` (authMutation) to accept `buildCommands: v.optional(v.array(v.string()))` and persist it in the `db.patch` / `db.insert` calls.

### 3. `packages/backend/convex/snapshotActions.ts`

- Update `buildSnapshotImage` signature to accept `buildCommands: string[]` (default `[]`).
- After the existing `"pnpm install --frozen-lockfile"` line (~line 124) chain a final `.runCommands(...buildCommands)` **only if non-empty**. The chain currently ends after `pnpm install` — append:
  ```ts
  const finalImage = image; // returned from current chain
  if (buildCommands.length > 0) {
    return finalImage.runCommands(...buildCommands);
  }
  return finalImage;
  ```
  (Refactor: store the chained image in a `let` so we can conditionally append.)
- In `kickOffSnapshotBuild` (line ~221), pass `config.buildCommands ?? []` into `buildSnapshotImage`.
- Append a log line in `appendLogs` listing how many build commands will run, mirroring the existing config-file count log (line ~232).

### 4. `apps/web/src/routes/_repo/$owner/$repo/settings/SnapshotsClient.tsx`

- Add a new card inside `<TabsContent value="configuration">` after the Clone Branch card (~line 148), styled identically (`rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`).
- Mirror the textarea pattern from `AppClient.tsx` lines 100–119 (newline-delimited, `defaultValue` from query, `onBlur` triggers mutation). Parser helper: `parseStartupCommands` already exists in AppClient — extract a shared `parseCommandLines(text: string): string[]` into `apps/web/src/routes/_repo/$owner/$repo/settings/_utils.ts` (new file) to avoid duplication. Both AppClient and SnapshotsClient import from there.
- Show the existing "Rebuild required after changes" amber warning banner (already present in `ConfigFilesSection`, lines 581–597) — extract to a shared `<RebuildRequiredWarning />` component in `apps/web/src/routes/_repo/$owner/$repo/settings/_components/RebuildRequiredWarning.tsx` and reuse in both places.
- `handleBuildCommandsBlur` calls `saveRepoSnapshot({ repoId, schedule, workflowRef: workflowRef.trim() || undefined, buildCommands: parsed })`.

### 5. `apps/web/src/routes/_repo/$owner/$repo/settings/AppClient.tsx`

- Replace the inline `parseStartupCommands` (lines ~10–15) and the inline rebuild-warning JSX with imports from the new shared modules above.

## Reuse / no new abstractions

- Textarea + onBlur + bg-muted card layout: existing pattern in AppClient.
- Warning banner: existing pattern in `ConfigFilesSection`.
- Image build chain: extends existing `buildSnapshotImage` in place.
- No new mutations, queries, or API surface — `saveRepoSnapshot` gains one optional arg.

## Type rules (CLAUDE.md)

- No `any` / `unknown` / `as`. Convex auto-generates `Doc<"repoSnapshots">` once `buildCommands` is in schema — both client and server pick it up automatically.

## Verification

1. Schema typecheck: `cd packages/backend && npx convex codegen --typecheck enable`.
2. Web typecheck: `cd apps/web && npx tsc --noEmit`.
3. Manual end-to-end:
   - Open `/<owner>/<repo>/settings/snapshots`, Configuration tab.
   - Enter `pnpm convex codegen` and `echo "baked at build" > /tmp/repo/.build-marker` in the new textarea, blur to save.
   - Confirm Convex dashboard shows `buildCommands` array on the `repoSnapshots` row.
   - Click "Rebuild Now" on the Status tab.
   - Watch Builds tab → expand the running build → verify the streamed Daytona logs show the two commands executing **after** `pnpm install`.
   - Spawn a sandbox from the snapshot, `cat /tmp/repo/.build-marker` → should print `baked at build`.
   - Empty/whitespace-only textarea → no extra `RUN` layers (verify by reading `image.dockerfile` in a Convex log or via the build logs).
4. Edge case: command that fails (e.g. `exit 1`) — Daytona build should fail and the error surfaces in the build logs as expected.

## Out of scope

- Per-build override of build commands (always uses current saved value).
- Reordering / drag-drop UI for commands — newline order is the order.
- Build commands that run _before_ pnpm install or as root (can be added later if needed; current Dockerfile structure makes this awkward).
