# Daytona env var + sandbox id field cleanup

**Date:** 2026-07-25
**Status:** DONE for §1 (env vars) + §3 (sandbox id collapse) on prod/mule 2026-07-29. §2 Rebuild Now for non-`snap_*` snapshot names remains a manual per-repo step.

Companion to [`daytona-legacy-data-cleanup.md`](./daytona-legacy-data-cleanup.md), which covers nulling legacy sandbox ids and narrowing the schema enum. This file covers the **stored env vars** and the **redundant sandbox id field**.

## 1. Delete the dead env vars (migration: `migrations:removeDaytonaEnvVars`)

Nothing in the codebase reads these any more — `SANDBOX_PROVIDER` has no consumer and the Daytona SDK is gone — but they are still stored as team/repo environment variables, which means they are still **decrypted and injected into every sandbox** as environment variables. That is pointless noise, and `DAYTONA_API_KEY` is a live credential sitting in the database for a service no longer in use.

`migrations:removeDaytonaEnvVars` strips both keys from every `teamEnvVars` and
`repoEnvVars` doc. Once it is deployed:

```
npx convex run migrations:removeDaytonaEnvVars '{"dryRun":true}' --prod  # count only
npx convex run migrations:removeDaytonaEnvVars --prod                   # delete
```

Then delete the migration file per the usual convention. Keys it removes:

- `SANDBOX_PROVIDER` (any value — `vercel` and `daytona` are both inert now)
- `DAYTONA_API_KEY`

Then:

- **Revoke the Daytona API key** in the Daytona dashboard, since it may still be valid.
- **Check the Daytona account for orphaned sandboxes.** Eva can no longer stop or delete them, so anything left running there may still be billing. Every session/task/project that had a Daytona sandbox now creates a fresh Vercel one instead, so nothing in Daytona is still needed.
- Consider closing the Daytona account entirely once the above is confirmed empty.

Done alongside the migration: the plaintext env-var mechanism (`PLAINTEXT_ENV_VAR_KEYS` / `isPlaintextEnvVarKey`, which existed only for the removed `SANDBOX_PROVIDER` toggle) was deleted, list queries now always mask, upserts always encrypt, and the stale `envVarListDisplay.test.ts` expectations went with it.

## 2. Rebuild snapshots that still point at Daytona names

Any repo whose `snapshotName` / `seededSnapshotName` is a Daytona-era name (e.g. `seeded-<repoId>` rather than `snap_*`) will fail the first Vercel create and fall back to a bare sandbox plus a fresh clone. That fallback works — `isSnapshotUnusableError` in `_sandbox_runtime/git.ts` now recognises Vercel not-found as well as Daytona state errors — but the first run is slow every time until the snapshot is rebuilt.

Fix per repo: **Settings → Snapshots → Rebuild Now**. Afterwards, confirm the stored name starts with `snap_`.

## 3. Collapse `sandboxId` and `vercelSandboxId` into one field

With one provider there is no reason to keep two id fields. Today the code reads `vercelSandboxId ?? sandboxId` (`preferPersistedSandboxId` / `resolveReusableVercelSandboxId` in `_sandbox/resolveExistingSandboxId.ts`) and writes both.

`vercelSandboxId` exists on 6 tables in `_validators/tableFields.ts`: sessions, agentTasks, projects, designSessions, and two others — confirm the full list before starting.

This is a **schema migration, not a refactor**, and it must follow the chicken-and-egg rule in `CLAUDE.md`:

1. Backfill `sandboxId = vercelSandboxId` wherever `vercelSandboxId` is set, and null `sandboxId` wherever it holds a Daytona UUID (the regex lives in `_sandbox/resolveExistingSandboxId.ts`). This overlaps step 1 of `daytona-legacy-data-cleanup.md` — do them together.
2. Deploy, run the migration, verify no row still has a UUID-shaped `sandboxId` and none has a `vercelSandboxId` differing from `sandboxId`.
3. Drop `vercelSandboxId` from the schema and the table fields.
4. Delete `resolveReusableVercelSandboxId`, `preferPersistedSandboxId`, and the `DAYTONA_UUID` regex — all three exist only to reconcile the two fields and the legacy id format.
5. Remove the `vercelSandboxId` args from the mutations/actions that thread it (`_sandbox_runtime/execution.ts` and `sessions.ts` carry several).

Do not attempt step 3 before step 2 completes: dropping the field while rows still depend on it loses the only pointer to a running sandbox, orphaning live VMs.

## Definition of done

A case-insensitive `daytona` grep over `packages/backend/convex` and `apps/web/src` returns zero hits, no team or repo env var mentions Daytona or `SANDBOX_PROVIDER`, and there is a single sandbox id field.
