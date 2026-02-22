# Per-Repo Environment Variables + Sidebar Cleanup

## Context

Environment variables for sandboxes are currently hardcoded in the backend (`daytona.ts`). Users have no way to configure per-repo secrets (API keys, tokens, etc.) that should be available when Claude runs in a sandbox. This change adds a UI to manage env vars per repo and injects them into all Daytona sandboxes automatically. It also cleans up the sidebar footer by replacing the bottom nav items with a compact dots-menu dropdown.

## Part 1: Sidebar Footer Cleanup

**File:** `apps/web/lib/components/Sidebar.tsx`

1. **Remove `bottomNavigation` memo** (lines 171-180) and its rendering block (lines 664-708) — removes Admin, Inbox, Settings links from the bottom of the sidebar nav.

2. **Replace `ThemeToggleClient` in the footer** (lines 711-746) with a dots-menu button (`IconDots`) that opens a `DropdownMenu` with:
   - **Toggle Theme** — calls `useThemeContext().toggleTheme`, shows sun/moon icon based on current theme
   - **Admin** — links to `/${repoSlug}/admin` (only shown when on a repo route)
   - **Settings** — links to `/settings`

3. Keep `NotificationsPopoverClient` in its current position.

4. Footer layout becomes: `[UserButton] [username] [dots-menu] [notifications]` (expanded) or `[UserButton] [dots-menu] [notifications]` (collapsed).

5. Import `useThemeContext` from `@/lib/contexts/ThemeContext`, add `IconDots`/`IconMoon`/`IconSun` imports, add `DropdownMenuItem`/`DropdownMenuSeparator` to existing `@conductor/ui` imports. Remove `ThemeToggleClient` import. Can also remove `IconShield`/`IconInbox`/`IconSettings` if no longer used elsewhere.

## Part 2: Backend — Schema + CRUD

### 2a. Schema

**File:** `packages/backend/convex/schema.ts`

Add new table:

```
repoEnvVars: defineTable({
  repoId: v.id("githubRepos"),
  vars: v.array(v.object({ key: v.string(), value: v.string() })),
  updatedAt: v.number(),
}).index("by_repo", ["repoId"])
```

Single doc per repo. Array of key-value pairs. Small expected size (<20 vars).

### 2b. CRUD file

**New file:** `packages/backend/convex/repoEnvVars.ts`

| Function        | Type            | Purpose                                                                                            |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `list`          | public query    | Returns vars with masked values for the UI. Mask: first 2 + `****` + last 4 for len>8, else `****` |
| `getForSandbox` | internalQuery   | Returns raw `vars` array for sandbox injection                                                     |
| `upsertVar`     | public mutation | Add or update a single env var (by key). Auth-gated via `getCurrentUserId` from `./auth`           |
| `removeVar`     | public mutation | Remove a var by key. Auth-gated                                                                    |

## Part 3: Backend — Sandbox Injection

**File:** `packages/backend/convex/daytona.ts`

### 3a. Modify `createSandbox` function (line 22)

Add optional 3rd param `extraEnvVars?: Record<string, string>`. Spread into the `envVars` object **before** the hardcoded system vars, so system vars cannot be overwritten by user-defined ones.

### 3b. Modify `setupAndExecute` internalAction (line 441)

- Add `repoId: v.optional(v.id("githubRepos"))` to args
- In handler: if `repoId` provided, call `ctx.runQuery(internal.repoEnvVars.getForSandbox, { repoId })` to get vars
- Convert `[{key, value}]` array to `Record<string, string>`, merge with existing `extraEnvVars` from `extraEnvVarNames`
- Pass merged vars to both `createSandbox()` and `launchScript()` as `extraEnvVars`

### 3c. Modify `startSessionSandbox` internalAction (line 555)

- Add `repoId: v.optional(v.id("githubRepos"))` to args
- In handler: if `repoId` provided, look up env vars via `ctx.runQuery(internal.repoEnvVars.getForSandbox, { repoId })`
- Pass to `createSandbox()` as `extraEnvVars`

### 3d. Update caller: `sessions.ts` `startSandbox` mutation (line 412)

Add `repoId: session.repoId` to the `startSessionSandbox` scheduler call.

### 3e. Update workflow callers of `setupAndExecute`

Add `repoId` to each `setupAndExecute` call. Since `repoId` is optional in `setupAndExecute`, this is backward-compatible. Files to update (each already has access to `repoId` via the entity they fetch):

- `taskWorkflow.ts` — `data.repoId` (from task's board lookup)
- `sessionWorkflow.ts` — `data.repoId` (from session)
- `designWorkflow.ts` — `sessionData.repoId` (from design session)
- `docPrdWorkflow.ts` — `docData.repoId` (from doc — need to check field name)
- `evaluationWorkflow.ts` — `docData.repoId` (from doc)
- `docInterviewWorkflow.ts` — `docData.repoId` (from doc)
- `projectInterviewWorkflow.ts` — `projectData.repoId` (from project)
- `testGenWorkflow.ts` — `docData.repoId` (from doc)
- `researchQueryWorkflow.ts` — `data.repoId` (from research query)
- `summarizeWorkflow.ts` — `sessionData.repoId` (from session)

Each workflow's internal `getData` query may need to include `repoId` in its return value if it doesn't already. This is the largest surface area but each change is mechanical (add one field to return + pass it through).

## Part 4: Frontend — Env Variables Page

### 4a. Add nav item to admin layout

**File:** `apps/web/app/(main)/[repo]/admin/layout.tsx`

Add to navigation array:

```
{ name: "Env Variables", href: baseUrl + "/env-variables", icon: IconKey }
```

Import `IconKey` from `@tabler/icons-react`.

### 4b. Create page route

**New file:** `apps/web/app/(main)/[repo]/admin/env-variables/page.tsx`

Server component that renders `<EnvVariablesClient />`.

### 4c. Create client component

**New file:** `apps/web/app/(main)/[repo]/admin/env-variables/EnvVariablesClient.tsx`

Following the `AnalyticsClient.tsx` pattern:

- Uses `useRepo()` to get `repo._id`
- `useQuery(api.repoEnvVars.list, { repoId })` for the variable list
- `useMutation(api.repoEnvVars.upsertVar)` for add/edit
- `useMutation(api.repoEnvVars.removeVar)` for delete

**UI layout:**

- `PageWrapper` with title "Environment Variables", "Add Variable" button in `headerRight`
- Empty state with icon + "No environment variables configured" message
- Table/list of variables: key name | masked value | edit + delete buttons
- Dialog for add/edit: key input (text), value input (type="password"), save button
- When editing, value field is empty with placeholder "Enter new value" (old value cannot be recovered)

## File Summary

**New files (3):**

1. `packages/backend/convex/repoEnvVars.ts`
2. `apps/web/app/(main)/[repo]/admin/env-variables/page.tsx`
3. `apps/web/app/(main)/[repo]/admin/env-variables/EnvVariablesClient.tsx`

**Modified files:**

1. `packages/backend/convex/schema.ts` — add `repoEnvVars` table
2. `packages/backend/convex/daytona.ts` — modify `createSandbox`, `setupAndExecute`, `startSessionSandbox`
3. `packages/backend/convex/sessions.ts` — pass `repoId` to `startSessionSandbox`
4. `apps/web/lib/components/Sidebar.tsx` — remove bottom nav, add dots-menu dropdown
5. `apps/web/app/(main)/[repo]/admin/layout.tsx` — add env-variables nav item
6. ~10 workflow files — pass `repoId` to `setupAndExecute`

## Implementation Order

1. Schema + CRUD backend (`repoEnvVars` table + `repoEnvVars.ts`)
2. Sidebar footer cleanup (remove bottom nav, add dots-menu)
3. Admin layout nav update + env variables page UI
4. Sandbox injection (`daytona.ts` changes)
5. Wire up all workflow callers with `repoId`

## Verification

1. `npx tsc --noEmit` in `apps/web` — no type errors
2. `npx convex dev` in `packages/backend` — schema deploys successfully
3. Navigate to `/[repo]/admin/env-variables` — page loads with empty state
4. Add a variable (e.g. `TEST_KEY` = `secret123`) — appears in list with masked value
5. Edit the variable — updates successfully, value re-masked
6. Delete the variable — removed from list
7. Dots-menu in sidebar footer — opens with Toggle Theme, Admin, Settings options
8. Toggle theme works, Admin links to correct admin page
9. Start a session sandbox — verify env vars are injected (check sandbox env)
