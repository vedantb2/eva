# Daytona legacy data cleanup

**Date:** 2026-07-23  
**Status:** TODO — execute after Daytona *code* removal has shipped  
**Do not run in the same session as the code deletion.**

## Goal

Purge legacy Daytona data from Convex, then narrow the schema and delete the guards deliberately kept when Daytona code was removed. After this plan completes, a case-insensitive `daytona` grep over `packages/backend/convex` and `apps/web/src` must return **zero** hits.

## Context (what the code-removal session already did)

- Vercel Sandbox is the only provider. Daytona SDK, adapter, PTY, volumes, and `SANDBOX_PROVIDER` flag logic are gone.
- Orchestration lives in `packages/backend/convex/_sandbox_runtime/` (renamed from `_daytona/`); public API is `api.sandbox` / `internal.sandbox`.
- **Accepted regression:** `ensureSessionPersistenceVolumes` was removed with no Vercel replacement — session Claude UUID volumes are gone.
- **Deliberately kept until this plan runs:**
  1. `DAYTONA_UUID` regex + ignore logic in `packages/backend/convex/_sandbox/resolveExistingSandboxId.ts` (`resolveReusableVercelSandboxId` / `resolveExistingSandboxId`)
  2. Daytona UUID cases in `packages/backend/tests/resolveExistingSandboxId.test.ts`
  3. `"daytona"` literal in `sandboxProviderKindValidator` (`packages/backend/convex/_validators/enums.ts` ~173–176) for historical `snapshotBuilds.provider`
  4. Permissive `sandboxId: v.string()` / `v.optional(v.string())` fields (may still hold Daytona UUIDs)
  5. `repoSnapshots.snapshotName` in schema (legacy Daytona snapshot-name field; distinct from Vercel `baseSnapshotId`)
  6. Legacy "Daytona" provider badge/label in `apps/web/src/routes/_repo/$owner/$repo/settings/_components/BuildRow.tsx` for historical builds

## Migration procedure (CLAUDE.md)

For each schema change with existing data:

1. Add a migration function under `packages/backend/convex/_migrations/`
2. Deploy code that includes the migration
3. **Run** the migration (dev first: `dev:good-mule-506`)
4. Narrow the schema / validators
5. Deploy schema narrowing
6. Delete the migration function

Prod: run migration **AFTER** the code deploy that adds the migration, **BEFORE** the schema-narrowing deploy. Use temporary `v.union(oldType, newType)` if a field type change needs a chicken-egg bridge.

---

## Step 1 — Delete Daytona `snapshotBuilds`

**Data:** rows with `provider: "daytona"` are dead (unusable on Vercel).

1. Add migration: scan `snapshotBuilds`, `delete` every doc where `provider === "daytona"`.
2. Run on `dev:good-mule-506`; verify count of remaining `provider: "daytona"` is 0.
3. Run on prod the same way.
4. Narrow `sandboxProviderKindValidator` in `_validators/enums.ts`:
   - **Option A:** `v.literal("vercel")` only
   - **Option B:** remove `provider` from `snapshotBuilds` / drop the validator if a single-value enum is pointless  
   Leave the choice to the executing agent; prefer Option B if nothing else reads the field for branching.
5. Delete migration function after schema deploy.

---

## Step 2 — Null Daytona UUID `sandboxId` values

**Pattern:** `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` (same as `DAYTONA_UUID` in `resolveExistingSandboxId.ts`).

**Tables / field-sets** (from `packages/backend/convex/_validators/tableFields.ts` as of 2026-07-23):

| Line | Field set | Field | Table (via schema) | Notes |
|------|-----------|-------|--------------------|-------|
| ~141 | `agentTaskFields` | `sandboxId` optional | `agentTasks` | also has `vercelSandboxId` |
| ~179 | `agentRunFields` | `sandboxId` optional | `agentRuns` | also has `vercelSandboxId` |
| ~222 | `sessionFields` | `sandboxId` optional | `sessions` | also has `vercelSandboxId` |
| ~388 | `projectFields` | `sandboxId` optional | `projects` | also has `vercelSandboxId` |
| ~475 | `automationRunFields` | `sandboxId` optional | `automationRuns` | also has `vercelSandboxId` |
| ~613 | `sandboxGitCredentialsFields` | `sandboxId` **required** | `sandboxGitCredentials` | delete row if UUID, or skip if already Vercel-named |
| ~648 | `docFields` | `sandboxId` optional | `docs` | also has `vercelSandboxId` |
| ~668 | `designSessionFields` | `sandboxId` optional | `designSessions` | also has `vercelSandboxId` |

Migration behavior:

- For optional `sandboxId`: if value matches Daytona UUID → `patch` to clear (`undefined` / omit). Do **not** touch `vercelSandboxId`.
- For `sandboxGitCredentials`: if `sandboxId` matches UUID → **delete** the credential row (orphaned Daytona sandbox auth).
- Re-read `tableFields.ts` / `schema.ts` at execution time in case line numbers drifted.

---

## Step 3 — Clear and drop `repoSnapshots.snapshotName`

- Distinct from Vercel `baseSnapshotId` (`schema.ts` ~298–300).
- Migration: for every `repoSnapshots` doc, clear `snapshotName` (empty string or placeholder only if schema still requires `v.string()` during the bridge).
- Then: drop `snapshotName` from schema / validators; deploy.
- Delete migration function.

---

## Post-migration code deletions

After data is clean and schema narrowed:

1. **`resolveExistingSandboxId.ts`**
   - Delete `DAYTONA_UUID` and the "ignore Daytona UUID" branch in `resolveReusableVercelSandboxId`.
   - Simplify to: `return args.vercelSandboxId ?? args.sandboxId` (same as `preferPersistedSandboxId`). Consider collapsing `resolveExistingSandboxId` / `resolveReusableVercelSandboxId` / `preferPersistedSandboxId` into one helper if they become identical.
2. **`resolveExistingSandboxId.test.ts`** — remove Daytona UUID cases; keep vercel prefer/fallback tests.
3. **`BuildRow.tsx`** — remove legacy "Daytona" provider badge/label; only Vercel remains (or drop badge entirely if single-provider).
4. Grep and scrub any leftover comments mentioning Daytona.

---

## Deployment notes

1. Dev first: `pnpm --filter @conductor/backend dev:evalucom` → deployment `dev:good-mule-506`.
2. Prod: deploy migration-capable code → run migrations → deploy schema narrowing.
3. Do not narrow validators before migrations finish on that deployment.

---

## Verification

```bash
rg -i 'daytona' packages/backend/convex apps/web/src
# expect: zero hits

rg '@daytonaio' packages/backend/package.json pnpm-lock.yaml
# expect: zero hits
```

Also: `cd packages/backend && npx convex codegen --typecheck enable` and `npx tsc` in `apps/web`.

---

## Final step

Run `/ship` (commit + push on the working branch per session rules).
