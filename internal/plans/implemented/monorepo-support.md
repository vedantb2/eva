# Monorepo Support — Root Directory per Repo Entry

## Problem

Monorepos (e.g. a single GitHub repo with `apps/web` + `apps/eprocurement`) had no way to specify which sub-app to target. Every repo was treated as a single unit — one sandbox, one dev server, one set of sessions. This meant you couldn't run independent sessions for different sub-apps, couldn't set per-app env vars, and the dev server always started from the repo root with no knowledge of which app to serve.

Additionally, monorepo sub-apps required manual addition from an admin page that only existed during the initial GitHub App install flow — which auto-syncs and redirects before anyone can use it. There was no post-setup management.

## Decisions

- **`rootDirectory` as part of repo identity** — Uniqueness changed from `owner + name` to `owner + name + rootDirectory`. This means the same GitHub repo can be connected multiple times, once per sub-app, each with independent sessions, env vars, and sandbox configs. Modeled after Vercel's "Root Directory" project setting.
- **URL slug encoding** — Root directories encoded in URL slugs using `~` as path separator (`owner-name~apps~web`). `decodeRepoSlug` returns `{ fullName, rootDirectory }`. Enables shareable URLs that preserve sub-app identity without breaking URL path structure.
- **Auto-detection via workspace config** — `detectAppsForRepo` parses `package.json` (npm workspaces) and `pnpm-workspace.yaml` to extract glob patterns, lists subdirectories, checks each for `package.json` with a `dev` script. Shared between manual action and automatic sync.
- **Auto-sync on `syncRepos`** — Every sync run auto-detects monorepo apps and upserts sub-app entries. Filters to `apps/` paths only. Root entries are kept (not deleted) to avoid orphaning data.
- **`devPort` per session** — Each sub-app runs its dev server on a different port. `detectDevPort` parses dev scripts for port flags (`-p`, `--port`), falls back to framework defaults (Next.js: 3000, Vite: 5173). Port stored on session/designSession documents and used for preview URLs instead of hardcoded 3000.
- **Data migration over schema wipe** — Existing data in root repo entries was migrated to sub-app entries across 14 tables via temporary mutations. Root entries preserved to prevent data loss.

## Implementation

### Backend — Schema & Core

1. **`schema.ts`** — Added `rootDirectory: v.optional(v.string())` to `githubRepos`. Added `devPort: v.optional(v.number())` to `sessions` and `designSessions`.

2. **`githubRepos.ts`** — `create`, `getByOwnerAndName`, `upsert` all accept `rootDirectory`. `getByOwnerAndName` filters by `rootDirectory` in addition to owner/name. `syncConnectedStatus` marks sub-apps as connected when their direct ID is in `connectedIds` or when their parent root repo is connected. New `deleteInternal` mutation for manual cleanup.

3. **`github.ts`** — `detectAppsForRepo` helper extracted from `detectMonorepoApps` action. Parses npm/pnpm workspace configs via GitHub Contents API, discovers sub-apps under workspace globs, checks each for `package.json` with dev script. `syncRepos` calls this for every repo and upserts sub-app entries with `rootDirectory`. Public `detectMonorepoApps` action exposed for manual use.

4. **`daytona.ts`** — `detectDevPort` helper parses dev script flags and framework defaults. `startSessionServices` and `startDesignSandbox` start dev servers in the correct `rootDirectory`, return detected port. `sandboxReady` mutations in `sessions.ts` and `designSessions.ts` accept and persist `devPort`.

### Backend — Auth

5. **`auth.ts`** — Updated to handle repo context with root directory awareness.

### Frontend — URL & Context

6. **`repoUrl.ts`** — `encodeRepoSlug(fullName, rootDirectory)` produces `owner-name~apps~web`. `decodeRepoSlug` returns `{ fullName, rootDirectory }` with `undefined` rootDirectory when no `~` present.

7. **`RepoContext.tsx`** — Passes `rootDirectory` from decoded slug to `getByOwnerAndName` query. Exposes `rootDirectory` in context alongside other repo data.

### Frontend — Navigation & Components

8. **`RepoSelect.tsx`** — Uses encoded slug as option value. Shows `rootDirectory` as subtitle below repo name.

9. **`Sidebar.tsx`** — Routes use encoded slugs. Added "Admin" to context sidebar modes with `AdminSidebar` rendering for admin routes.

10. **`AdminSidebar.tsx`** — New navigation component with Env Variables, Snapshots, and Monorepo nav items.

11. **`MonorepoClient.tsx` + `page.tsx`** (new) — Admin page at `/[repo]/admin/monorepo`. Auto-detects workspace apps on mount via `detectMonorepoApps`. Displays connected sub-apps with status badges. Allows adding detected apps or custom root directories. Re-detect button with loading state.

12. **`ReposClient.tsx`** — Dropdown menu on each repo card with "Manage apps" action navigating to monorepo admin page. Cards show app name from root directory path.

13. **`RepoSetupClient.tsx`** — On repo selection during setup, calls `detectMonorepoApps` and shows expandable sub-app picker with checkboxes + custom path input.

### Frontend — All Link Updates

14. **`ProjectsClient.tsx`**, **`ProjectDetailClient.tsx`**, **`ProjectsListView.tsx`**, **`ProjectsTimeline.tsx`**, **`NewProjectModal.tsx`**, **`GroupTasksModal.tsx`**, **`DesignDetailClient.tsx`**, **`SessionDetailClient.tsx`**, **`SandboxPanel.tsx`** — All updated to use `encodeRepoSlug(fullName, rootDirectory)` when constructing navigation links.

## Flow

```
GitHub repo with monorepo structure
  → syncRepos runs (or user triggers detectMonorepoApps manually)
  → detectAppsForRepo reads package.json/pnpm-workspace.yaml
  → Discovers apps/web, apps/eprocurement, etc.
  → Upserts githubRepos entry per sub-app with rootDirectory
  → User navigates to /owner-name~apps~web/sessions
  → RepoContext decodes slug → { fullName: "owner/name", rootDirectory: "apps/web" }
  → Queries getByOwnerAndName with rootDirectory filter
  → Session created → sandbox starts dev server in apps/web
  → detectDevPort finds port from dev script → stored as devPort
  → SandboxPanel uses devPort for preview URL
```

## Files Touched

- `packages/backend/convex/schema.ts` (edit)
- `packages/backend/convex/githubRepos.ts` (edit)
- `packages/backend/convex/github.ts` (edit)
- `packages/backend/convex/daytona.ts` (edit)
- `packages/backend/convex/sessions.ts` (edit)
- `packages/backend/convex/designSessions.ts` (edit)
- `packages/backend/convex/auth.ts` (edit)
- `apps/web/lib/utils/repoUrl.ts` (edit)
- `apps/web/lib/contexts/RepoContext.tsx` (edit)
- `apps/web/lib/components/RepoSelect.tsx` (edit)
- `apps/web/lib/components/Sidebar.tsx` (edit)
- `apps/web/lib/components/sidebar/AdminSidebar.tsx` (edit)
- `apps/web/lib/components/projects/NewProjectModal.tsx` (edit)
- `apps/web/lib/components/projects/ProjectsListView.tsx` (edit)
- `apps/web/lib/components/projects/ProjectsTimeline.tsx` (edit)
- `apps/web/lib/components/quick-tasks/GroupTasksModal.tsx` (edit)
- `apps/web/app/(main)/[repo]/admin/monorepo/MonorepoClient.tsx` (new)
- `apps/web/app/(main)/[repo]/admin/monorepo/page.tsx` (new)
- `apps/web/app/(main)/[repo]/design/[id]/DesignDetailClient.tsx` (edit)
- `apps/web/app/(main)/[repo]/projects/ProjectsClient.tsx` (edit)
- `apps/web/app/(main)/[repo]/projects/[projectId]/ProjectDetailClient.tsx` (edit)
- `apps/web/app/(main)/[repo]/sessions/[id]/SandboxPanel.tsx` (edit)
- `apps/web/app/(main)/[repo]/sessions/[id]/SessionDetailClient.tsx` (edit)
- `apps/web/app/(main)/home/ReposClient.tsx` (edit)
- `apps/web/app/(main)/setup/[id]/RepoSetupClient.tsx` (edit)
