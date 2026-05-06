# Per-App Dev Config (devCommand, devPort, startup commands)

## Context

Currently dev port + dev command are auto-detected at sandbox startup (framework defaults: 3000 for Next, 5173 for Vite — see `packages/backend/convex/_daytona/devServer.ts`). There's no way to override. Startup commands live on `githubRepos.startupCommands` but are edited from the **Snapshots** settings tab, which is conceptually wrong — they're per-app runtime config, not snapshot config.

Goal: store `devCommand` + `devPort` per app in the backend, prefer user-defined values, fall back to current detection. Move startup commands UI out of Snapshots into the App config page.

## Schema changes

**`packages/backend/convex/validators.ts`** — add to `githubRepoFields`:

```ts
devPort: v.optional(v.number()),
devCommand: v.optional(v.string()),
```

`startupCommands` already exists on this table — no schema change for that.

## Backend mutation

**`packages/backend/convex/_githubRepos/mutations.ts`**

Extend existing `updateConfig` mutation (line 158) — add `devPort`, `devCommand`, `startupCommands` optional args. Reuse the same auth + patch path; pass empty string / empty array as "clear override" via `undefined`.

Then **delete** the now-redundant `updateStartupCommands` mutation (lines 309-339) and remove its export from `packages/backend/convex/githubRepos.ts` (line 19).

## Sandbox consumption

**`packages/backend/convex/_daytona/devServer.ts`** — change `startSessionServices` signature to accept overrides:

```ts
export async function startSessionServices(
  sandbox: Sandbox,
  rootDir: string,
  overrides?: { devPort?: number; devCommand?: string },
): Promise<{ port: number; devCommand: string }>;
```

Logic:

- If `overrides.devPort` set → use it; else `detectDevPort(...)`.
- If `overrides.devCommand` set → use it verbatim (user takes responsibility for `cd` + PORT). Else build `cd ${dir} && PORT=${port} ${pm} run dev`.

**`packages/backend/convex/_daytona/sessions.ts`** — at every `startSessionServices(sandbox, rootDir)` call site (lines 421, 603, 810, 852, 948, 1055), pass `{ devPort: repo.devPort, devCommand: repo.devCommand }`. The repo doc is already loaded in those flows (`args.repoId` → `ctx.db.get`); thread it through if not already in scope.

## UI changes

### New "App" settings tab

Create:

- `apps/web/src/routes/_repo/$owner/$repo/settings/app.tsx` — TanStack route file (mirror `config.tsx` pattern).
- `apps/web/src/routes/_repo/$owner/$repo/settings/AppClient.tsx` — client component.

Add a nav entry alongside existing settings tabs (find the settings sidebar/tabs nav and add "App").

`AppClient.tsx` contains three fields, all bound directly to `repo.*` and saved via `updateConfig` on blur:

1. **Dev Port** (`<Input type="number">`, `defaultValue={repo.devPort ?? ""}`, placeholder e.g. "Auto (5173 for vite, 3000 for next)").
2. **Dev Command** (`<Input>`, placeholder `Auto (cd ${rootDirectory} && PORT=${port} pnpm run dev)`). Treated **fully literal** — no PORT injection. Helper text: "When set, runs verbatim. You're responsible for `cd` and `PORT=`."
3. **Startup Commands** (`<textarea>`, parses lines via `parseStartupCommands` helper — copied from `SnapshotsClient.tsx` lines 37-44).

Helper text under port/command: "Leave empty to auto-detect."

### Remove from `SnapshotsClient.tsx`

**`apps/web/src/routes/_repo/$owner/$repo/settings/SnapshotsClient.tsx`**

Delete:

- `parseStartupCommands` helper (lines 37-44)
- `updateStartupCommands` mutation hook (lines 56-58)
- `startupCommands` derived value (line 67)
- `handleStartupCommandsBlur` (lines 87-97)
- Startup Commands card JSX (lines 175-195)

## Files to modify

- `packages/backend/convex/validators.ts` — add 2 fields
- `packages/backend/convex/_githubRepos/mutations.ts` — extend `updateConfig`, delete `updateStartupCommands`
- `packages/backend/convex/githubRepos.ts` — remove `updateStartupCommands` export
- `packages/backend/convex/_daytona/devServer.ts` — accept overrides
- `packages/backend/convex/_daytona/sessions.ts` — pass overrides at 6 call sites
- `apps/web/src/routes/_repo/$owner/$repo/settings/app.tsx` — **new** route file
- `apps/web/src/routes/_repo/$owner/$repo/settings/AppClient.tsx` — **new** client component
- Settings nav (locate component listing tabs: Config, Snapshots, Env Variables, etc.) — add "App" entry
- `apps/web/src/routes/_repo/$owner/$repo/settings/SnapshotsClient.tsx` — remove startup commands UI

## Reused utilities

- `parseStartupCommands` — move from `SnapshotsClient.tsx` to `AppClient.tsx`.
- `detectDevPort`, `detectPackageManager` — kept as fallback in `devServer.ts`.
- Auth/patch logic in `updateConfig` — already handles team membership check.

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` — schema + mutation types compile.
2. `cd apps/web && npx tsc --noEmit` — frontend types compile.
3. Manual:
   - Settings → Config: enter port `4000`, leave dev command empty → start sandbox → preview URL hits 4000.
   - Settings → Config: enter dev command `cd apps/web && PORT=8080 pnpm dev` → port field empty → sandbox uses literal command, preview hits 8080.
   - Both empty → falls back to current auto-detect (verify Next/Vite defaults still work).
   - Startup commands edited from Config tab persist and run on next sandbox start.
   - Snapshots tab no longer shows Startup Commands card.

## Resolved decisions

- Dev command override is **fully literal** — user owns `cd` + `PORT=`.
- UI lives in a **new dedicated "App" settings tab**, not the existing Config tab.
