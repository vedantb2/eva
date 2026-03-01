# Monorepo Support — Vercel-like Root Directory per Repo Entry

## Context

When a monorepo (e.g. `apps/eprocurement` + `apps/web`) is connected, there's no way to:

- Know which app to start the dev server for
- Inject different env vars per app (they'd conflict on same keys)
- Have separate sessions/sandboxes per app

The solution: treat each monorepo sub-app as its own `githubRepos` entry with a `rootDirectory` field, like Vercel's "Root Directory" project setting. Same GitHub repo can be connected multiple times, each pointing to a different app directory with its own env vars, sessions, and sandbox config.

---

## Step 1: Schema — add `rootDirectory` to `githubRepos`

**`packages/backend/convex/schema.ts`**

Add to `githubRepos` table:

```
rootDirectory: v.optional(v.string())   // e.g. "apps/web", empty/undefined = repo root
```

No migration needed (optional field). No index change — `by_owner_name` still works, we just filter results by `rootDirectory` in queries.

---

## Step 2: Backend — `githubRepos.ts` updates

**`packages/backend/convex/githubRepos.ts`**

- `githubRepoValidator`: add `rootDirectory: v.optional(v.string())`
- `create` mutation: accept `rootDirectory` arg, update uniqueness check to match on `owner + name + rootDirectory` (collect all with same owner+name, check if any has same rootDirectory)
- `getByOwnerAndName`: accept optional `rootDirectory` arg, filter results. For backward compat: if no `rootDirectory` param, return first match where rootDirectory is undefined/empty.
- `upsert`: accept `rootDirectory`, same uniqueness change

---

## Step 3: Backend — monorepo detection action

**`packages/backend/convex/github.ts`**

New action: `detectMonorepoApps`

- Args: `installationId`, `owner`, `name`
- Returns: `Array<{ name: string, path: string, hasDevScript: boolean }>`
- Uses GitHub Contents API (Octokit) — no sandbox needed:
  1. Fetch `/contents/package.json` → check `workspaces` field
  2. Fetch `/contents/pnpm-workspace.yaml` → parse workspace globs
  3. If neither → return empty (not a monorepo)
  4. For each workspace glob base dir, list entries
  5. For each entry, fetch `package.json` → check for `scripts.dev`
  6. Return detected apps

---

## Step 4: Backend — dev server startup in `daytona.ts`

**`packages/backend/convex/daytona.ts`**

**a) `detectPackageManager(sandbox)` — extract from `cloneAndSetupRepo` into shared helper**

**b) `detectDevPort(sandbox, rootDir)` — new helper**

- Read `package.json` from `${WORKSPACE_DIR}/${rootDir}`
- Parse dev script for `--port`, `-p`, `PORT=`
- Fall back to framework defaults from dependencies (next→3000, vite→5173, etc.)
- Default: 3000

**c) Implement `startSessionServices(sandbox, rootDir)`**

- Detect package manager
- Detect port from dev script
- Run: `cd ${WORKSPACE_DIR}/${rootDir} && PORT=${port} ${pm} run dev > /tmp/devserver.log 2>&1 &`
- Return detected port

**d) Update `startSessionSandbox` and `startDesignSandbox`**

- Fetch `rootDirectory` from the repo doc (need to pass `repoId` and read repo)
- Pass `rootDirectory` to `startSessionServices`
- Pass returned port to `sandboxReady` mutation

**e) Update `getPreviewUrl` action**

- Keep as-is (already takes port param from frontend)

---

## Step 5: Backend — store `devPort` on sessions

**`packages/backend/convex/schema.ts`**

Add to both `sessions` and `designSessions`:

```
devPort: v.optional(v.number())
```

**`packages/backend/convex/sessions.ts`**

- Update `sandboxReady` args: add `devPort: v.optional(v.number())`
- Patch session with `devPort`
- Update `sessionValidator`: add `devPort`

**`packages/backend/convex/designSessions.ts`**

- Same changes

---

## Step 6: Frontend — URL slug encoding

**`apps/web/lib/utils/repoUrl.ts`**

Update slug format:

- Without root dir: `owner-name` (unchanged)
- With root dir: `owner-name~apps~web` (append `~` + root dir with `/` → `~`)

```ts
encodeRepoSlug(fullName, rootDirectory?) → string
decodeRepoSlug(slug) → { fullName, rootDirectory? }
```

All callers updated to pass root directory where available.

---

## Step 7: Frontend — `RepoContext` update

**`apps/web/lib/contexts/RepoContext.tsx`**

- `decodeRepoSlug` now returns `{ fullName, rootDirectory }`
- `getByOwnerAndName` query called with optional `rootDirectory` param
- `RepoContextType` gets new field: `rootDirectory: string | undefined`

---

## Step 8: Frontend — setup page monorepo detection

**`apps/web/app/(main)/setup/[id]/RepoSetupClient.tsx`**

When user clicks "Add" on a repo:

1. Call `github.detectMonorepoApps` action
2. If monorepo detected: show expandable list of sub-apps with checkboxes
   - Each sub-app shows name + path (e.g. "web — apps/web")
   - "Add root" option for connecting the repo root itself
   - Manual path input field for custom root directory
3. If not monorepo: add directly (current behavior)
4. Each selected entry calls `githubRepos.create` with `rootDirectory` set

---

## Step 9: Frontend — home page display

**`apps/web/app/(main)/home/ReposClient.tsx`**

- Repo card shows root directory below the name when set
- e.g. name = "web", subtitle = "myorg/monorepo → apps/web"
- Link uses `encodeRepoSlug(fullName, rootDirectory)`

---

## Step 10: Frontend — preview port auto-detection

**`apps/web/app/(main)/[repo]/sessions/[id]/SandboxPanel.tsx`**

- Replace `useState(3001)` with `session.devPort ?? 3000`
- Port updates reactively when `sandboxReady` patches the session with `devPort`
- User can still override port via WebPreviewPanel input

**`apps/web/app/(main)/[repo]/design/[id]/DesignDetailClient.tsx`**

- Replace hardcoded `port: 3000` with `session.devPort ?? 3000`

---

## Files Changed (in order)

| #   | File                                                            | Change                                                                                                                       |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | `packages/backend/convex/schema.ts`                             | Add `rootDirectory` to `githubRepos`, `devPort` to sessions + designSessions                                                 |
| 2   | `packages/backend/convex/githubRepos.ts`                        | Update validator, create, getByOwnerAndName, upsert for `rootDirectory`                                                      |
| 3   | `packages/backend/convex/github.ts`                             | New `detectMonorepoApps` action                                                                                              |
| 4   | `packages/backend/convex/daytona.ts`                            | `detectPackageManager`, `detectDevPort`, implement `startSessionServices`, update `startSessionSandbox`/`startDesignSandbox` |
| 5   | `packages/backend/convex/sessions.ts`                           | Update `sandboxReady` + `sessionValidator` with `devPort`                                                                    |
| 6   | `packages/backend/convex/designSessions.ts`                     | Update `sandboxReady` + `designSessionValidator` with `devPort`                                                              |
| 7   | `apps/web/lib/utils/repoUrl.ts`                                 | Handle root directory in slug encode/decode                                                                                  |
| 8   | `apps/web/lib/contexts/RepoContext.tsx`                         | Parse root dir from slug, pass to query                                                                                      |
| 9   | `apps/web/app/(main)/setup/[id]/RepoSetupClient.tsx`            | Monorepo detection + app picker UI                                                                                           |
| 10  | `apps/web/app/(main)/home/ReposClient.tsx`                      | Show root directory in cards, updated links                                                                                  |
| 11  | `apps/web/app/(main)/[repo]/sessions/[id]/SandboxPanel.tsx`     | Use `session.devPort` instead of hardcoded 3001                                                                              |
| 12  | `apps/web/app/(main)/[repo]/design/[id]/DesignDetailClient.tsx` | Use `session.devPort` instead of hardcoded 3000                                                                              |

---

## Verification

1. `npx convex dev` — schema compiles, no errors
2. `npx tsc` in `packages/backend` — no type errors
3. Connect a monorepo repo → setup page detects sub-apps → add two entries with different rootDirectories
4. Home page shows both entries with root dir labels, links work
5. Start sandbox for one entry → dev server starts in correct directory → correct port auto-detected → preview loads
6. Env vars page works independently per entry
7. Backward compat: existing repos without rootDirectory still work
