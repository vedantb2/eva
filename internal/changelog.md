# Changelog

## Projects Timeline: Fix Drag-to-Pan on Windows — 2026-02-24

- **Why**: Viewport panning (grab-and-drag to scroll timeline) was completely broken on Windows. Clicking and dragging did nothing, making it impossible to navigate the timeline without scroll/zoom.
- **Root cause**: The refactor from mouse events to pointer events introduced a regression. `e.movementX` returns 0 on Windows when pointer capture is active, so `scrollLeft` never changed during drag operations.
- **Fix**: Rewrote the three pointer handlers (`handlePointerDown`, `handlePointerMove`, `handlePointerUp`) to use absolute `clientX` delta instead of incremental `movementX`. The new implementation tracks `{ startX: number; startScroll: number }` in a single `dragRef`, computes `delta = startX - clientX`, and applies `startScroll + delta` for reliable cross-platform panning.
- **Movement threshold**: The implementation only sets `isDragging(true)` when `|delta| > DRAG_THRESHOLD_PX` (4px), allowing clicks on project bars/labels to pass through naturally without suppression. Changed `onPointerDownCapture` to `onPointerDown` so child elements receive their events first.
- **Impact**: Timeline panning now works reliably on all platforms (Windows, macOS, Linux) using absolute position math that avoids accumulated errors from incremental deltas.

## MCP Server: Fix OAuth 302 Redirect for Third-Party Clients — 2026-02-23

- **Why**: The `POST /oauth/authorize` endpoint rendered an HTML page with a hidden iframe to deliver the authorization code. This worked for Claude Desktop's popup-based flow but broke for any other MCP client (ChatGPT, Cursor, etc.) that expected a standard OAuth 302 redirect. Third-party clients would hang forever waiting for the redirect callback.
- **Root cause**: `renderRedirectPage()` function rendered HTML with `<iframe src="${callbackUrl}">` instead of issuing an HTTP 302 redirect. This was designed for popup windows but violated the OAuth 2.1 spec (RFC 6749 Section 4.1.2) which requires a 302 redirect to `redirect_uri?code={code}&state={state}`.
- **Fix**: Replaced `res.type("html").send(renderRedirectPage(redirectUrl))` with `res.redirect(redirectUrl)` in the POST handler. Deleted the `renderRedirectPage` function entirely.
- **Impact**: The OAuth flow now works universally — Claude Desktop popups, third-party MCP clients in tabs, embedded browsers. All follow 302 redirects correctly.

## Repos: Add Connection Status Tracking — 2026-02-22

- **Why**: When users revoked access to a repo via GitHub, the repo remained in the list showing no indication it was no longer connected. Users had no way to distinguish between active and disconnected repos.
- **Schema change**: Added optional `connected` boolean field to `githubRepos` table to track repo accessibility status.
- **Sync detection**: Modified `syncRepos` action to compare repos returned by GitHub API against stored repos. Repos no longer accessible are marked `connected: false`; newly found repos are marked `connected: true`. Added `syncConnectedStatus` internal mutation to handle bulk status updates.
- **UI indicator**: Added red "Disconnected" badge to repo cards when `connected: false`. GitHub icon also dims for disconnected repos, providing visual feedback that access has been revoked.

## Repos Page: Onboarding UI Overhaul — 2026-02-22

- **Why**: The previous empty state was a sparse icon + button with no context. New users had no understanding of what the platform offered before connecting GitHub. The welcome banner was also minimal and gave little guidance once repos were connected.
- **Empty state redesigned** into a full `EmptyOnboarding` component: a 3-step progress indicator, a focused CTA section (connect GitHub), and a feature preview grid of four platform sections (Projects, Sessions, Quick Tasks, Documents) with descriptions.
- **WelcomeBanner improved** into a "Getting started with Eva" guide with a 4-column feature grid, showing each tool's name and purpose. Now animated in/out with `motion/react` via `AnimatePresence`.
- **State lifted**: Welcome-dismissed state moved from inside `WelcomeBanner` to `ReposClient` so the parent controls conditional rendering, and `AnimatePresence` can handle the exit animation cleanly.

## MCP Server: Convex HTTP Action Bug Fixes — 2026-02-22

- **Why**: Two bugs prevented the MCP server from bootstrapping after deployment. First, the Convex bundler rejected `http.ts` because it statically imported `mcpRoutes.ts` → `encryption.ts` → `node:crypto`, and Convex's V8 HTTP router cannot have Node.js APIs in its import chain. Second, the bootstrap and env-vars endpoints were being called on the wrong domain — Convex HTTP actions are served at `.convex.site`, not `.convex.cloud`, but `CONDUCTOR_CONVEX_URL` uses `.convex.cloud`.
- **`node:crypto` fix**: Restructured `http.ts` to define handlers inline with no static imports of node-specific code. The `/api/mcp/env-vars` handler now delegates env var decryption to `mcpRoutes.getDecryptedRepoEnvVars` (a Node.js `internalAction`) via `ctx.runAction` at runtime, keeping the V8 bundle free of `node:crypto`.
- **`.convex.site` fix**: Added `toSiteUrl()` helper in `convex-api.ts` that derives the `.convex.site` domain from the `.convex.cloud` URL. Bootstrap and env-vars calls now use the site URL; all other Convex REST API calls (`/api/query`, `/api/run_test_function`) continue using `.convex.cloud`.
- **Troubleshooting docs**: Updated README with specific error messages for 401/404/500 bootstrap failures, added the Convex deployment step to setup instructions, and documented the `.convex.cloud` vs `.convex.site` URL distinction.

## Remove Sandpack/CodeSandbox from Design Sessions — 2026-02-22

- **Why**: The `@codesandbox/sandpack-react` package was only used for a legacy preview path (`LegacySandpackPreview`) for old design session variations that stored raw React component code in a `code` field. The modern flow uses Daytona sandboxes with iframe previews. The legacy path was dead weight adding a large dependency.
- **Removed**: `LegacySandpackPreview` component, `SandpackConfig` interface, `isLegacyVariation` helper, and `sandpackConfig` prop from `DesignDetailClient`. Removed `getSandpackConfig()` and all CSS/theme extraction logic from `page.tsx`.
- **Schema cleanup**: Removed `code` field from `variationValidator` in `designSessions.ts` and from `schema.ts`. Ran a one-time DB migration (`migrateRemoveLegacyCode`) to strip the field from all existing documents, then removed the migration function.
- **Package removed**: `@codesandbox/sandpack-react` uninstalled from `apps/web`.

## MCP Server: Repo-Aware Queries Without Credential Exposure — 2026-02-22

- **Why**: The previous `get_repo_env_vars` tool returned decrypted environment variable values (API keys, database URLs) as MCP tool output, making credentials visible to Claude and users. This violated the security requirement that only query results should be returned, never credential values.
- **Removed**: `get_repo_env_vars` tool — no longer exposes env var values.
- **Repo-aware queries**: All 5 query tools (`list_tables`, `query_table`, `get_document`, `run_query`, `count_table`) now accept an optional `repoId` parameter. When provided, the MCP server internally fetches that repo's Convex credentials from Conductor's `repoEnvVars`, resolves the correct Convex URL and deploy key, and queries that repo's database — credentials never leave server memory.
- **New function**: `getRepoConvexCredentials()` in `convex-api.ts` fetches repo env vars, extracts `NEXT_PUBLIC_CONVEX_URL`/`CONVEX_URL` and `CONVEX_DEPLOY_KEY`/`CONVEX_ADMIN_KEY`, and caches them by repoId.
- **New helper**: `resolveTarget()` in `tools.ts` determines whether a query targets Conductor's Convex (default) or a repo's own Convex (when `repoId` provided).
- **User experience**: Claude calls `list_repos`, user picks a repo, Claude adds `repoId` to subsequent query tools. All credential resolution happens server-side; only results are returned.

## MCP Server: Auth-Only Setup + Codebase Env Var Injection — 2026-02-22

- **Why**: The MCP server required `CONDUCTOR_DEPLOY_KEY` as an MCP server env var (Railway), which was redundant config to manage separately from the Convex deployment. Users also had no way to select a codebase and get its env vars injected into Claude's context.
- **Deploy key bootstrap**: `CONDUCTOR_DEPLOY_KEY` is now stored only in Convex env vars. On first tool call, the MCP server fetches it via `GET /api/mcp/bootstrap` (authenticated with `MCPBootstrap {MCP_JWT_SECRET}`) and caches it in memory. Removed from Railway/MCP server env vars.
- **New Convex HTTP routes** (`packages/backend/convex/http.ts` + `mcpRoutes.ts`): `GET /api/mcp/bootstrap` returns the deploy key; `POST /api/mcp/env-vars` returns decrypted env vars for a given repo (using `repoEnvVars.getForSandbox` + `decryptValue`).
- **New MCP tools**: `list_repos` (lists all connected GitHub repos) and `get_repo_env_vars` (returns decrypted per-repo env vars). Claude now prompts the user to pick a codebase, then injects that repo's vars into context.
- **`ConvexCredentials` interface change**: Removed `deployKey` field, added `clerkUserId`. Deploy key is lazily bootstrapped in `convex-api.ts` and cached module-level.
- **Architectural reason**: Centralising the deploy key in Convex env vars means it's managed in one place alongside `ENCRYPTION_KEY` and other backend secrets, rather than duplicated across two deployments.

## Documents and Testing Arena Sidebar Migration — 2026-02-22

- **Why**: Documents and Testing Arena had their own `SidebarLayoutWrapper`-based secondary sidebars inside the page layout, inconsistent with how Design, Sessions, Analyse, and Admin work through the main sidebar context panel.
- **Solution**: Created `DocsSidebar` and `TestingArenaSidebar` components and wired them into the main `Sidebar.tsx` context panel pattern. Both nav items now transition the sidebar instead of rendering a separate panel.
- **DocsSidebar**: Search + doc list with delete (dots menu), create new untitled doc via `+` button, Upload PRD button at sidebar bottom. All logic moved from `DocsClient` + `DocsList`.
- **TestingArenaSidebar**: Search + doc list as test targets, "Test All" confirmation dialog triggered by `+` button. All logic moved from `TestingArenaClient`.
- **Deleted**: `DocsClient.tsx`, `TestingArenaClient.tsx`, `DocsList.tsx` — all now unused; layouts simplified to `{children}`.

## Admin Elevated to Sidebar Context Panel — 2026-02-22

- **Why**: Admin was buried in a three-dots dropdown at the sidebar footer, making it hard to discover and inconsistent with how other sections (Design, Sessions, Analyse) work.
- **Solution**: Added "Admin" as a first-class sidebar nav item under an ADMIN group. Clicking it opens a context sidebar panel (same pattern as Design/Sessions/Analyse) with links to Overview, Stats, Env Variables, and Snapshots.
- **New file**: `apps/web/lib/components/sidebar/AdminSidebar.tsx` — simple static nav, no Convex queries needed, renders immediately without waiting for repo data.
- **Sidebar changes**: Added `"admin"` to `ContextSidebarMode`, `CONTEXT_SIDEBAR_BY_NAV_NAME`, and `getInitialContextSidebarMode`. `+` create button is hidden when in admin context mode. Admin removed from footer dropdown.
- **Admin layout simplified**: Removed `SidebarLayoutWrapper` and the duplicated secondary sidebar from `admin/layout.tsx` — now just renders `{children}` directly.

## Per-Repo Snapshot Management (GitHub Actions) — 2026-02-20

- **Why**: All sandboxes used a hardcoded `eva-snapshot` rebuilt daily by a GitHub Action. Users couldn't control when snapshots rebuild, customize their setup, or manage snapshots for different repos independently. The initial Daytona SDK approach hit sandbox storage limitations during image builds.
- **Solution**: New admin UI (Admin > Snapshots) lets users configure per-repo Daytona snapshots with custom rebuild schedules (daily/every 3 days/weekly/manual), custom setup commands, and custom environment variables baked into the snapshot image.
- **Dynamic crons**: Uses `@convex-dev/crons` component for per-repo dynamic scheduling — each repo gets its own independent cron job that self-registers and self-deletes when the schedule changes.
- **GitHub Actions build**: Instead of building snapshots via Daytona SDK (which has storage limits), Convex triggers a `workflow_dispatch` on the repo's `rebuild-snapshot.yml` GitHub Action. The workflow generates a Dockerfile dynamically, builds the Docker image on GitHub's runner (14GB+ disk), and pushes to Daytona via CLI. Convex polls the GitHub Actions API for completion.
- **Per-repo setup**: Each repo needs `rebuild-snapshot.yml` workflow file + `DAYTONA_API_KEY` GitHub secret + `SNAPSHOT_GITHUB_PAT` (with `actions:write` scope) in Admin > Env Variables.
- **Fallback**: Repos without a snapshot config continue using the global `eva-snapshot`.
- **New tables**: `repoSnapshots` (config per repo) and `snapshotBuilds` (build history with logs, `workflowRunId` for GitHub Actions link).

## MCP Server: Clerk Authentication — 2026-02-20

- **Why**: MCP server required users to manually enter a Convex deployment URL and deploy key during OAuth authorization. This was disconnected from the main app's auth — users already have Conductor accounts via Clerk, yet had to provide raw credentials for the MCP integration.
- **Solution**: Replaced the manual credential form with Clerk's prebuilt sign-in widget on the OAuth authorize page. After sign-in, the server verifies the Clerk session token server-side (`@clerk/backend`), then issues MCP OAuth tokens containing the user's Clerk ID.
- **Simplification**: MCP tools now use shared `CONDUCTOR_CONVEX_URL` + `CONDUCTOR_DEPLOY_KEY` env vars for all Convex API calls. JWTs are self-contained (no database lookup needed). Removed `tokenStore` in-memory cache, `persistToken`, and `mcpTokens` table dependency. The `mcpTokens` table is now dead code (cleanup in follow-up).
- **New env vars**: `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` required on the MCP server (same values as the web app).

## System Env Var Validation + Infrastructure Category Cleanup — 2026-02-20

- **Why**: Workflows (sessions, projects, tasks, design, testing) failed mid-execution with cryptic errors like "No OAuth accounts available" when required system env vars weren't configured. No upfront validation or user feedback existed. Additionally, the admin UI exposed an "Infrastructure" category for vars that should be Convex env vars, not platform DB entries.
- **Validation**: New `getSetupStatus` Convex query checks if at least 1 OAuth token is configured. `useSetupStatus` hook + `SetupBanner` component show a persistent dismissible alert on all repo pages when setup is incomplete.
- **Hard block**: All 8 workflow trigger points (task execution, session chat, session sandbox auto-start, design send/sandbox, project build, project chat, testing arena) disable their action buttons when no OAuth tokens are configured.
- **Admin UI cleanup**: Removed the Infrastructure category from the System Variables admin page. Only OAuth tokens are shown/addable now — infrastructure vars should live as Convex env vars with process.env fallback.

## MCP Server: Persistent Token Storage — 2026-02-20

- **Why**: MCP server stored OAuth tokens (user Convex credentials) in in-memory Maps. Every Railway deploy/restart wiped all tokens, forcing users to re-authenticate by entering their Convex URL + deploy key again.
- **Solution**: New `mcpTokens` Convex table stores token→credentials mapping with encrypted deploy keys (AES-256-GCM via existing `encryption.ts`). MCP server writes to Convex on token creation (fire-and-forget) and falls back to Convex on cache miss after restart.
- **Architecture**: In-memory Map kept as hot cache for zero-latency reads. Convex actions (`mcpTokensActions.ts`) handle encryption/decryption server-side — MCP server only needs `CONDUCTOR_CONVEX_URL` + `CONDUCTOR_DEPLOY_KEY` env vars, not `ENCRYPTION_KEY`.
- **Graceful degradation**: If Conductor env vars aren't set, server falls back to in-memory-only behavior (current behavior). No breaking changes.

## Chrome Extension Distribution Pipeline — 2026-02-19

- **Why**: The Eva Assist Chrome extension had no distribution pipeline. Team members had to manually load the unpacked `dist/` folder in developer mode, with no auto-update mechanism. This doesn't scale for team adoption.
- **Convex backend**: New `extensionReleases` table stores CRX files in Convex file storage with version tracking. Public `getLatest` query (unauthenticated, required by Chrome's update poller). Admin mutations protected by `EXTENSION_ADMIN_KEY` env var.
- **Update server**: Fixed `apps/web/app/api/updates/extension/route.ts` — previously read from local filesystem (broken on Vercel), now queries Convex for the latest release and serves Omaha-protocol XML. CRX downloads redirect to Convex storage URL.
- **Release script**: `pnpm ext:release` builds the extension, injects `update_url` into the manifest, packs as CRX using Chrome CLI, uploads to Convex storage, and records the release. Chrome auto-updates within ~5 hours.
- **Intune deployment**: PowerShell scripts and README with 4 deployment methods (Settings Catalog, OMA-URI, PowerShell script, manual registry). Uses `normal_installed` mode — auto-installs but users can remove.

## Dynamic System Environment Variables — 2026-02-19

- **Why**: OAuth tokens and infrastructure secrets (CLERK_SECRET_KEY, NEXT_PUBLIC_CONVEX_URL, etc.) were hardcoded as Convex environment variable names. Adding/removing OAuth accounts required code changes. This makes the system inflexible and ties it to a specific deployment's env vars.
- **New `systemEnvVars` table**: Stores env vars encrypted at rest (AES-256-GCM) with two categories: `claude_oauth` (OAuth tokens for rate limit rotation) and `infrastructure` (secrets injected into sandboxes). Only bootstrap vars remain as Convex env vars: `ENCRYPTION_KEY`, `DAYTONA_API_KEY`, `CONVEX_CLOUD_URL`.
- **Dynamic OAuth discovery**: `aiAccounts.ts` no longer has a hardcoded 3-element array. `getAvailableAccountKey` dynamically queries `systemEnvVars` for `claude_oauth` entries and picks the first non-limited account. `aiAccountStatus` now references `systemEnvVars` via `accountId`.
- **`resolveSystemEnvVars()` in `daytona.ts`**: Single helper that fetches infrastructure vars + resolves the OAuth token from DB before creating a sandbox. Includes process.env fallback for infrastructure keys during the transition period.
- **Admin UI**: New "System Variables" tab under Admin (admin-gated) for managing system env vars — add, edit, reveal, copy, delete with encrypted storage.

## Remote Convex MCP Server — 2026-02-19

- **Why**: The Analyse page wraps "Claude generates and runs Convex queries" but Claude natively handles this better via MCP connectors. A remote MCP server lets any user connect their Convex deployment to Claude and query data directly — no custom UI needed.
- **Architecture**: Stateless Express server at `apps/mcp-server/` using `@modelcontextprotocol/sdk` with Streamable HTTP transport. OAuth 2.0 with PKCE flow stores Convex credentials (deployment URL + deploy key) in a signed JWT — no database needed.
- **5 MCP tools**: `list_tables` (schema discovery via `/api/shapes2` + `_system/frontend/getSchemas`), `query_table` (paginated reads via `_system/cli/tableData`), `get_document` (single doc by ID), `count_table` (document count), `run_query` (arbitrary read-only Convex query code via `/api/run_test_function`).
- **`run_query` is the power tool**: Claude writes Convex server-side JS (joins, aggregations, filters) and executes it read-only. Replaces the entire Analyse page workflow.
- **Replaces**: `apps/web/app/(main)/[repo]/analyse/` and related backend (`researchQueries.ts`, `researchQueryWorkflow.ts`, `savedQueries.ts`). Those can be deprecated once this ships.

## Desktop: Fix Slow Tab Switching and Navigation — 2026-02-19

- **Render diff tabs with CSS visibility toggle instead of mount/unmount**: PatchDiff from `@pierre/diffs/react` was being unmounted and remounted from scratch on every diff tab switch — expensive because it re-parses and re-renders the full syntax-highlighted diff. Now uses the same pattern as TerminalView: all diff tabs stay mounted, inactive ones hidden via `display: none`. Wrapped in a memoized `DiffTabContent` component.
- **Defer xterm.js cleanup to next tick**: When navigating away from a session (e.g. clicking the plus button), all TerminalView components unmounted synchronously, each calling `term.dispose()` which tears down WebGL contexts. This blocked the navigation transition. Moved `term.dispose()` into `setTimeout(0)` so cleanup runs after React finishes the transition.
- **Split DiffTabContext into data + actions**: GitPanel only needs `openDiffTab` and `openAllDiffsTab` (actions), but the monolithic context caused it to re-render on every `activeDiffTabId` change (`useContext` bypasses `memo`). Split into `DiffTabDataContext` and `DiffTabActionsContext` — same pattern already used by SessionContext.

## Claude Usage Limit Detection + Auto-Switch + Schedule Later — 2026-02-19

- **Why**: When Claude Code CLI hits usage limits during sandbox execution, tasks silently fail with a generic error. Users have no visibility into why a task failed or when they can retry. With multiple OAuth accounts available, the system should rotate to an available account before giving up.
- **Error classification**: Callback script now captures stderr and classifies errors by pattern-matching rate limit indicators (`usage limit`, `rate_limit_error`, `429`). Extracts reset time when available.
- **Multi-account rotation**: New `aiAccounts.ts` tracks per-account rate limit status. Task and session workflows automatically mark the current account as limited, clear expired limits, and retry with the next available account before failing.
- **Schema additions**: `errorType`/`limitResetAt` on `agentRuns`, `scheduledRetryAt` on `agentTasks`, new `aiAccountStatus` table, `rate_limit` notification type.
- **Frontend**: Rate limit banner in task detail modal with reset time and "Schedule Retry" button. Quick task cards show amber warning styling for rate-limited tasks vs red for generic errors. Rate limit notification type with warning styling.
- **All 11 workflow `handleCompletion` mutations** updated to accept `errorType`, `limitResetAt`, and `accountKey` from the callback script.

## Desktop: Main Process Startup Optimizations — 2026-02-19

- **Disabled default Electron menu**: `Menu.setApplicationMenu(null)` prevents Electron from building a full default menu at startup — wasted work since the app uses a custom frameless titlebar.
- **Reordered startup sequence**: Previously `initDatabase()` → `createWindow()` (which registered handlers + loaded URL). Now: create window + load URL first, then init DB and register handlers while the renderer is loading. The renderer can't send IPC until its preload + React scripts execute, so handlers are ready well before they're needed.
- **Lazy-loaded `simple-git` via dynamic import**: Changed from eager top-level `import { simpleGit }` to async `import("simple-git")` on first git operation. Since `simple-git` is externalized (not bundled), the eager `require()` was adding to handler registration time even though git ops aren't needed until the user opens a session with a repo.

## Desktop: Performance Improvements Round 4 — 2026-02-19

- **Split SessionContext into two contexts**: Single monolithic context caused every consumer to re-render on any session change. Split into `SessionListContext` (sessions array) and `SessionActionsContext` (activeSessionId + callbacks). `HomePage` now only subscribes to actions — no longer re-renders when the session list changes.
- **Memoized provider values**: Both SessionContext and DiffTabContext were creating new value objects every render, defeating `React.memo` on all consumers. Wrapped in `useMemo`.
- **Wrapped key components in `memo`**: `TerminalView`, `GitPanel`, and `SessionSidebar` now skip re-renders when their props haven't changed. Terminal is especially expensive (xterm.js reconciliation).
- **Stabilized GitPanel filters and callbacks**: `stagedFiles`/`unstagedFiles` arrays were recreated every render via `.filter()`, defeating `FileSection` memo. Wrapped in `useMemo`. `handleStageAll`/`handleUnstageAll`/`handleCommit` now read from `status` directly instead of depending on the derived arrays.
- **Reduced git watcher debounce**: 1500ms → 500ms. The old delay made the git panel feel sluggish after file saves. 500ms still coalesces rapid changes but feels responsive.
- **Guarded redundant tab respawn IPC**: Clicking the already-active terminal tab was firing a `tabRespawn` IPC call on every click. Now tracks active tab in a ref and skips the call.
- **SQLite performance pragmas**: Added `synchronous=NORMAL` (safe with WAL), `cache_size=-8000` (8MB page cache), `temp_store=MEMORY` (temp tables in RAM).
- **Eliminated window flash on startup**: Added `show: false` + `ready-to-show` to BrowserWindow — window now appears fully rendered instead of flashing white.

## Encrypt Repo Environment Variables at Rest — 2026-02-19

- **Why**: Env var values were stored as plaintext in Convex, meaning anyone with dashboard access, data exports, or even the public `list` query could see raw secrets. The `list` query was sending real values to the client with only cosmetic client-side masking.
- **Encryption**: AES-256-GCM via `node:crypto`. Values stored as `enc:<base64(iv+ciphertext+tag)>`. Requires `ENCRYPTION_KEY` Convex env var (32-byte hex).
- **Server-side masking**: `list` query now returns `"••••••"` for all values — real values never leave the backend. Removed copy button from UI.
- **Backward compatible**: `decryptValue()` passes through non-prefixed values as plaintext, so existing data works until re-saved through the UI.
- **Architecture**: Split `upsertVar` from mutation to action in new `repoEnvVarsActions.ts` (`"use node"`) since encryption requires Node.js crypto. Decryption added to all 3 sandbox injection points in `daytona.ts`.

## Centralize GitHub API Access in Convex — 2026-02-19

- **Unified GitHub auth across backend**: Moved `syncGitHubRepos` server action and `getWorkflowTokens` GitHub auth logic to Convex actions. All GitHub App token generation now flows through Convex, eliminating duplicated `@octokit/auth-app` code across web and sandbox modules.
- **Refactored task PR creation**: Updated `taskWorkflowActions.ts` to use Octokit instead of raw fetch, consistent with other Convex GitHub actions.
- **Removed GitHub client code from web app**: Deleted `apps/web/lib/github/client.ts` (dead code) and removed `octokit` and `@octokit/auth-app` from web dependencies. GitHub App env vars no longer needed by web — only Convex.
- **Cleaned up dead code**: Removed `getGitHubToken` from sandbox.ts (never imported), deleted `syncGitHubRepos` server action file (migrated to Convex), removed unused GITHUB\_\* env vars from web server env validation.
- **Preserved server action for auth layering**: Kept `getWorkflowTokens` as a Next.js server action (still needs Clerk token) — it now delegates GitHub auth to `getInstallationTokenAction` Convex action. ~20 callers unchanged (same signature).

## Desktop: Performance Improvements Round 3 — 2026-02-19

- **Cached simpleGit instances per repo**: Every git operation was constructing a new `simpleGit()` instance (re-discovering git config each time). Now cached per repo path, eliminating repeated setup across the 8 call sites.
- **WebGL terminal renderer**: Added `@xterm/addon-webgl` for GPU-accelerated terminal rendering. Canvas renderer was the bottleneck during heavy Claude streaming output. Falls back to canvas automatically if WebGL context fails.
- **Debounced ResizeObserver with rAF**: `fitAddon.fit()` + `ptyResize` IPC was firing on every pixel change during window resize. Now coalesced via `requestAnimationFrame` to at most one fit/resize per frame.
- **Fixed handleDelete callback stability**: `handleDelete` in SessionContext depended on `activeSessionId`, causing the callback reference to change on every session switch and breaking all downstream memoization (SessionSidebar → SessionItem). Switched to functional updater for `setActiveSessionId` — now zero deps, stable forever.
- **Lazy session restore (active tab only)**: `SESSION_RESTORE` was spawning PTYs for ALL tabs at once. Now only spawns the active tab's PTY. Added `TAB_RESPAWN` IPC channel so the renderer lazily spawns a tab's PTY when the user clicks it. `spawnPty` is already idempotent (returns immediately if PTY exists).

## Move GitHub API Routes to Convex Actions — 2026-02-19

- **Moved 4 Next.js API routes to Convex actions** (`packages/backend/convex/github.ts`): `getInstallationToken`, `listBranches`, `listRepos`, `createSessionPr`. Centralizes server-side GitHub logic in Convex, consistent with the earlier preview route migration.
- **Web callers updated**: `ChatPanel.tsx` (create-pr), `useBranches.ts` (branches), `RepoSetupClient.tsx` (repos) now use `useAction` from `convex/react` instead of `fetch()` to Next.js API routes.
- **Chrome extension callers updated**: `App.tsx` and `ChatPanel.tsx` now use `useAction(api.github.getInstallationToken)` instead of HTTP fetch to the web app, eliminating the dependency on `CONDUCTOR_URL`/`VITE_API_URL` for these calls.
- **Deleted**: 4 API route files, `useGitHubToken.ts` hook (dead code).
- **Added `octokit` and `@octokit/auth-app`** to `packages/backend` dependencies. GitHub App env vars (`GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) must be set in Convex dashboard.
- **Note**: `apps/web/lib/github/client.ts` still needed by server actions in `actions.ts` files — left as-is for now.

## Desktop: Performance Improvements Round 2 — 2026-02-19

- **Removed StrictMode**: `React.StrictMode` double-fires every effect in dev mode, meaning PTYs spawn→kill→spawn, IPC calls fire twice, and git watchers start→stop→start. Removed it since this is a desktop app where we control the runtime.
- **Per-file diff endpoint**: Clicking a file in the git panel was fetching diffs for ALL files then filtering to one. Added `getFileDiff(repoPath, filePath, staged)` that runs `git diff` scoped to a single file, making diff tab opens near-instant.
- **Memoized GitFileItem, FileSection, TabButton, DiffTabButton**: Wrapped all list-rendered components in `React.memo()`. Removed `useDiffTabContext()` from GitFileItem (passed `onViewDiff` as prop instead) to stop context-change cascades.
- **Stabilized callback references**: Wrapped all GitPanel action handlers in `useCallback`. Changed TabButton/DiffTabButton to accept handler + ID instead of pre-bound closures, so memo actually works.
- **Watcher debounce 500ms → 1500ms**: During heavy file writes (Claude streaming), 500ms debounce triggered `git status` too frequently. 1500ms reduces thrash while still feeling responsive.
- **In-flight refresh guard**: Added ref-based guard to GitPanel's `refresh()` — if a `git status` is already running, the next request is queued and runs after, preventing stacked concurrent calls.

## Desktop: Performance Improvements — 2026-02-19

- **Fixed SQLite N+1 queries**: `selectAllSessions()` was running 1 + N queries (one per session to fetch tabs). Replaced with a single `LEFT JOIN` query that fetches all sessions and tabs in one round-trip, then groups in JS.
- **Eliminated unnecessary full-session reads**: `addTab`, `removeTab`, and `setActiveTab` each loaded the entire session (with all tabs) just to check existence. Replaced with lightweight single-column queries (`sessionExists`, `selectTabPtyId`, `tabExistsInSession`).
- **Removed redundant re-query in SESSION_CREATE**: Handler was calling `getSession()` after `createSession()` + `spawnTab()`. Now constructs the return object directly from what those functions already produce.
- **Batched PTY data before IPC**: Every byte of terminal output was firing a separate IPC message. Added `setImmediate`-based batching that coalesces all chunks within an event loop tick into a single IPC send, reducing hundreds of messages/sec to 1-2 during heavy output.
- **Memoized SessionItem**: Wrapped in `React.memo()` so it only re-renders when its own props change, not on every session list update. Stabilized `handleDelete` callback with `useCallback` to avoid breaking memoization.
- **Added xterm.js scrollback limit**: Set `scrollback: 5000` (was unlimited). Long sessions could accumulate hundreds of thousands of lines, eating memory and slowing rendering.

## Desktop: SQLite Persistence for Sessions — 2026-02-19

- **Replaced in-memory session store with SQLite** (`better-sqlite3`) so sessions, tabs, and preferences survive app restarts. Previously all state was lost on quit.
- **Session restore flow**: On app restart, persisted sessions appear in the sidebar. Clicking one re-spawns PTYs for all tabs (terminal output is blank but the CLI tool restarts). `spawnPty` guard makes this idempotent — safe on already-running sessions.
- **New database module** (`src/main/db/`): `database.ts` (WAL mode, foreign keys, init/close lifecycle), `migrations.ts` (version-stamped via `PRAGMA user_version`), `queries.ts` (typed wrappers with boundary parsing instead of `as` casts).
- **3 tables**: `sessions` (with `last_opened_at` for recency sorting, `pinned` for future use), `tabs` (FK cascade delete), `preferences` (key-value).
- **Recent repos on home page**: Derived from sessions table via `SELECT DISTINCT repo_path`, shown as clickable items that pre-fill the folder path.
- **Preferences IPC**: `preferences:get`/`preferences:set` channels for future settings persistence.
- **App quit no longer deletes sessions**: Removed the `before-quit` loop that cleared all sessions; now just kills PTYs, stops watchers, and closes the DB.
- Native module setup: `better-sqlite3` added to `onlyBuiltDependencies` (root package.json) and `asarUnpack` (electron-builder config).

## Refactor Design Sessions: Sandbox-Based Live Preview — 2026-02-19

- **Switched from Sandpack to live iframe preview**: Design sessions now use a persistent Daytona sandbox with a real dev server instead of Sandpack. Claude writes actual files into the project's `app/design-preview/` directory, and the user sees real previews rendered by the project's own framework with actual Tailwind config/design tokens.
- **Git-tracked design history**: Each design iteration is committed on a `design/{designSessionId}` branch, so design history is tracked in git rather than stored as inline JSON.
- **New sandbox lifecycle**: Added `startSandbox`/`stopSandbox` mutations and `startDesignSandbox` action — lighter than session sandboxes (no code-server, no terminal). Sandbox auto-starts on first message if not running.
- **Workflow uses existing sandbox**: Instead of `setupAndExecute` creating a new sandbox per workflow run, the workflow now uses the already-running persistent sandbox via `launchOnExistingSandbox`.
- **Backward compatibility**: Old design sessions with `variation.code` still render via Sandpack; new sessions with `variation.route` render via iframe.
- **Schema changes**: Added `branchName` to `designSessions`, updated variation shape to include optional `route` and `filePath` fields alongside optional `code`.

## Move Branch Selector from Sidebar to Inline Contexts — 2026-02-19

- Removed the global sidebar branch selector — it stored a branch in `localStorage` but nothing ever read it (dead feature)
- Branch selection is now per-context: standalone tasks, new projects, and testing arena each have their own `BranchSelect` inline component
- **Standalone tasks**: Branch selector appears in the task detail modal sidebar when the task has no project and status is "todo". The selected `baseBranch` is threaded through `triggerExecution` → workflow → `setupAndExecute` so the sandbox checks out the correct base before creating the working branch
- **New projects**: Branch selector added to the create project form. Stored as `baseBranch` on the project document and used when `startDevelopment` / `buildWorkflow` creates the working branch
- **Testing arena**: Branch selector in the header (via nuqs URL state) so evaluations can test against a specific branch. Passed through `startEvaluation` → evaluation workflow → `setupAndExecute` as `baseBranch`
- **Backend**: Added `baseBranch` param to `daytona.setupAndExecute` — when set, runs `git fetch + checkout + pull` on that branch before `setupBranch` creates the working branch. Added `baseBranch` to project schema and `projects.create` mutation
- Created reusable `useBranches` hook (extracted from old `BranchSelector`) and `BranchSelect` controlled component

## Per-Repo Environment Variables + Sidebar Cleanup — 2026-02-19

- **Per-repo env vars**: Users can now configure key-value environment variables per GitHub repo via Admin > Env Variables. Variables are stored in Convex (`repoEnvVars` table), masked in the UI, and automatically injected into Daytona sandboxes when sessions and workflows run — so API keys, tokens, etc. are available to Claude without hardcoding
- **Sandbox injection**: `createSandbox` accepts optional `extraEnvVars` spread before system vars (user vars can't overwrite system vars). `setupAndExecute` and `startSessionSandbox` look up repo env vars via `repoEnvVars.getForSandbox` when `repoId` is provided. All 10+ workflow files now pass `repoId` through to `setupAndExecute`
- **Sidebar footer cleanup**: Replaced bottom nav items (Admin, Inbox, Settings) and standalone theme toggle with a compact dots-menu dropdown (`IconDots`) containing Toggle Theme, Admin (repo-scoped), and Settings — reduces footer clutter

## Snapshot Rebuild: Daily Schedule Instead of Per-Commit — 2026-02-19

- Changed `rebuild-snapshot.yml` trigger from `push` to `main` to a daily cron at 7 AM UTC — avoids unnecessary snapshot rebuilds on every commit when the base image rarely changes
- Added `workflow_dispatch` for manual triggers when needed

## Fix Type Errors + Move View PR to Header — 2026-02-19

- **Regenerated Convex types** — `npx convex codegen` to pick up the new `sessionAudits` module that was missing from the generated API types, fixing `api.sessionAudits` / `internal.sessionAudits` resolution errors
- **Removed invalid `branchName` prop** from `QuickTasksKanbanBoard` and `QuickTasksListView` — `agentTasks` schema doesn't have `branchName`, the card already fetches PR URL from `agentRuns` independently
- **Moved "View PR" badge** from above the prompt input to the ChatPanel header bar, next to "Send for Review" — shows as a mutually exclusive pair: View PR when `prUrl` exists, Send for Review when only `branchName` exists

## Multi-Step Review Modal for Sessions — 2026-02-19

- Replaced the single-step confirmation dialog for "Send for Review" with a 3-step animated modal: Confirm → Auditing Progress → Review Sent
- **Backend: `sessionAudits` table** — mirrors `taskAudits` structure (accessibility, testing, codeReview arrays with pass/fail results + summary). Indexed by `sessionId`
- **Backend: `sessionAudits.ts`** — `getBySession` query (frontend subscribes for real-time status), `startAudit` mutation (creates record + schedules sandbox action), `handleCompletion` callback mutation (sandbox calls back with parsed JSON results), `fail` internal mutation
- **Backend: `runSessionAudit` action in `daytona.ts`** — gets git diff from session sandbox, builds audit prompt (same 3-category format as task audits), launches Claude Haiku via `launchScript` with fire-and-forget nohup pattern. Sandbox calls back to `sessionAudits:handleCompletion` when done
- **Frontend subscribes to real audit status** — `useQuery(api.sessionAudits.getBySession)` reactively updates when the audit record changes. Stagger animation (spinner → checkmark) triggers only when the backend audit completes, not on fake timers
- **Graceful fallback**: if the audit mutation fails to start (e.g. sandbox inactive), the modal falls back to a timer-based animation so the user isn't stuck — the PR was still created successfully
- Fixed dialog spacing: added `space-y-4` to each `motion.div` step wrapper to restore the `gap-4` lost when `AnimatePresence` became the only direct child of `DialogContent`

## Desktop: View All Diffs + Push Button — 2026-02-18

- **PR-style "Review All" diff view** — new "Review All" eye icon in git panel header opens a single tab showing all staged + unstaged diffs in collapsible file cards with status badges, reviewed checkboxes, and a progress summary bar
- **Git push support** — added push button (arrow-up icon) next to the commit button, shows ahead count in tooltip, disabled when nothing to push. Full IPC pipeline: ipc-channels → operations → handlers → preload
- **DiffTab discriminated union** — refactored `DiffTab` into `SingleFileDiffTab | AllFilesDiffTab` to support both single-file and all-files diff views in the same tab system. SessionPage routes to `AllDiffsView` or `PatchDiff` based on tab kind

## Desktop: Diff Tabs in Main Panel — 2026-02-18

- **Moved diffs from inline expansion to center-panel tabs** — clicking a file in the git panel now opens a diff tab alongside terminal tabs (VS Code style) instead of expanding a cramped inline diff inside the narrow git panel
- Created `DiffTabContext` to bridge the `GitPanel` ↔ `SessionPage` sibling gap — shared context holds diff tab state (open, close, focus), provided by `AppShellInner`
- Deterministic tab IDs (`diff:staged:path` / `diff:unstaged:path`) ensure re-clicking a file focuses the existing tab rather than duplicating it
- Diff tabs clear automatically on session switch
- Removed inline expand/collapse logic from `GitFileItem`, deleted the now-unused `DiffViewer` component

## Improve Diff Viewer UI (Web + Desktop) — 2026-02-18

- **Web DiffPanel**: Added unified/split view toggle, word-level inline diff highlighting (`lineDiffType: "word"`), collapsible unchanged regions (`expandUnchanged`), and `+N -N` line count stats in the file sidebar — the bare-bones PatchDiff setup now feels closer to VS Code/GitHub's diff viewer
- **Desktop DiffViewer**: Replaced the custom table-based diff renderer (DiffLine/DiffHunk/DiffFile types, manual line counting, no syntax highlighting) with `@pierre/diffs` PatchDiff — same library used by web, gives syntax highlighting, word-level diffs, and dark theme for free
- **Desktop data flow simplification**: Removed `parseDiff()` in `diff.ts` that split raw git output into typed hunks/lines (100+ lines of parsing code). Replaced with `splitPatchByFile()` that just splits the raw multi-file patch into per-file strings — PatchDiff handles all parsing internally
- Deleted `apps/desktop/src/main/git/diff.ts`, replaced `DiffFile`/`DiffHunk`/`DiffLine` types with single `RawFilePatch` interface

## Replace Session Diff Viewer with @pierre/diffs — 2026-02-18

- Replaced the hand-rolled line-by-line diff renderer with `PatchDiff` from `@pierre/diffs` — the custom renderer had no syntax highlighting, no line numbers, and no inline change highlighting
- `@pierre/diffs` provides Shiki-based syntax highlighting, line numbers, word-level inline diffs, and automatic light/dark theme via Shadow DOM — all for free with zero custom rendering code
- Removed the `DiffLine` component entirely; the file sidebar and header bar are unchanged
- Fixed `as` type assertion in `getConfig` with a proper type guard function

## Desktop: Session-Based Terminal Manager Rearchitecture — 2026-02-18

- **Rearchitected the desktop app from agent-based one-shot workflow to session-based interactive terminal manager** — the app now focuses on being a lightweight IDE wrapper around CLI AI tools (Claude Code, OpenCode, Codex)
- Users select a repo folder, pick a tool, and get an interactive terminal session instead of filling a form to spawn a one-shot `claude --print` agent
- Multiple terminal tabs per session (Claude Code, OpenCode, Codex, Shell) with tab switching that preserves scroll buffer via `display: none`
- New git panel (right sidebar, collapsible) with real-time file status, stage/unstage, inline diffs, and commit — auto-refreshes via chokidar file watcher
- Session sidebar replaces agent sidebar — shows repo name, tab count, and relative time
- Removed all agent and worktree infrastructure (agent runner, worktree manager, agent IPC channels, agent types) — replaced with session store, tab spawner, git operations via `simple-git`
- Added `simple-git` (clean git API) and `chokidar` (file watching) as new dependencies
- Fixed `as Record<string, string>` type assertion in pty/manager.ts with proper `Object.fromEntries` + filter

## Desktop: Folder Picker + Optional Worktree — 2026-02-18

- Replaced manual repo path text input with a native OS folder picker dialog — eliminates typos and invalid paths
- Added "Create worktree" checkbox (default: checked) so users can run agents directly in a repo without creating a worktree/branch
- When worktree is unchecked, branch input is hidden and agent spawns directly in the selected folder
- `killAgent` now skips worktree removal when no worktree was created (checks `worktreePath` is non-empty)
- New `dialog:openDirectory` IPC channel wired through preload bridge to Electron's `dialog.showOpenDialog`
- **Fixed node-pty native module crash**: Config file was named `electron-vite.config.ts` (hyphens) but electron-vite v3 expects `electron.vite.config.ts` (dots) — the entire config was silently ignored, so `externalizeDepsPlugin()` never ran and node-pty was bundled inline instead of externalized. Renamed file; main bundle dropped from 54KB to 10KB.
- Added `asarUnpack` for `node-pty` in electron-builder config so native `.node` binaries are accessible outside the asar archive in distribution builds

## Improve Project Timeline UI — 2026-02-18

- Increased row height (36→40px) and label column width (192→200px) for better readability
- Adaptive day label spacing based on zoom level — prevents label overlap at low zoom
- Alternating month shading in header for visual rhythm
- Phase-colored dot next to project labels in the sidebar column
- Alternating row backgrounds with hover highlight
- Timeline bars use vibrant phase colors (rounded-full, 8px height) with tooltip showing title + date range
- Today indicator: solid primary dot + vertical line replacing faint text
- Deadline markers: centered diamond shape at row midpoint
- Undated projects section: accent strip pattern with phase-colored left border
- "Today" button with dot indicator for quick navigation

## Add List View Toggle to Projects & Quick Tasks Pages — 2026-02-18

- Added list view as a third view option on the Projects page (alongside kanban and timeline)
- Added kanban/list view toggle to the Quick Tasks page (previously had no toggle)
- List views show items grouped by section (phase for projects, status for tasks) with collapsible headers
- Both list views reuse existing card components (ProjectCard, QuickTaskCard) for consistent behavior
- Quick Tasks list view includes the "Fix All" button in the todo section header, status filtering, and selection mode support
- View state persisted in URL via nuqs (`quickTaskViewParser` added to search-params.ts, `projectViewParser` expanded to include "list")

## Complete Inngest Removal — Migrate Session Sandbox + Project Cleanup to Convex — 2026-02-17

- Migrated final 3 Inngest functions (`startSandbox`, `stopSandbox`, `cleanupProjectSandbox`) to Convex
- Added `deleteSandbox` internalAction in `daytona.ts` — fire-and-forget sandbox deletion reused by session stop and project cleanup
- Added `startSessionSandbox` internalAction in `daytona.ts` — creates/reuses Daytona sandbox, sets up git + pnpm install + dev server + code-server, calls `sandboxReady`/`sandboxError` mutations when done
- Added `startSandbox`, `stopSandbox`, `sandboxReady`, `sandboxError` to `sessions.ts` — public mutations use `ctx.scheduler.runAfter` pattern (no workflows needed)
- Updated `clearProjectSandbox` in `projects.ts` to also schedule sandbox deletion via `deleteSandbox`
- Updated frontend: `SessionsSidebar.tsx`, `SessionDetailClient.tsx`, `ProjectActiveLayout.tsx` — replaced `fetch("/api/inngest/send")` with direct Convex mutations
- Created `apps/web/lib/sandbox.ts` with PTY/WebSocket utilities moved from `inngest/sandbox.ts`
- **Fully removed Inngest**: deleted all files under `apps/web/lib/inngest/` and `apps/web/app/api/inngest/`, removed `inngest` dependency from package.json, removed `pnpm inngest` script
- Updated CLAUDE.md to remove all Inngest references

## Migrate Task Execution + Build Project from Inngest to Convex Workflows — 2026-02-17

- Migrated `executeTask` and `buildProject` from Inngest background jobs to Convex Workflows for durable orchestration
- Created `taskWorkflow.ts` with task execution workflow: sandbox setup, Claude CLI execution, PR creation, subtask completion, notifications, and post-execution code audits
- Created `taskWorkflowActions.ts` with Node.js-specific actions (GitHub PR creation) separated from the workflow file per Convex runtime constraints
- Created `buildWorkflow.ts` with sequential project build workflow that orchestrates multiple task executions using inter-workflow events (`buildTaskDoneEvent`)
- Updated three frontend components (TaskDetailModal, QuickTasksKanbanBoard, ProjectDetailClient) to use Convex mutations instead of `fetch("/api/inngest/send")`
- Added `activeWorkflowId` to agentTasks and `activeBuildWorkflowId` to projects schema for workflow event routing
- Removed dead code: deleted `agentExecution.ts` and removed auto-execute logic from `moveToColumn` (never called from frontend)
- Updated chrome extension `App.tsx` to use Convex `triggerExecution` mutation instead of `fetch` to Inngest, using `/api/github/installation-token` for GitHub tokens
- Deleted `execute-task.ts` and `build-project.ts` Inngest functions; remaining Inngest functions: startSandbox, stopSandbox, cleanupProjectSandbox
- Migrated `runAudit` from synchronous Convex action to Daytona fire-and-forget pattern (`launchAudit` in `daytona.ts` + `auditCompleteEvent`/`handleAuditCompletion` callback)
- `activeWorkflowId` is now cleared at end of workflow (after audit completes) instead of in `completeRun`, so audit callback can route events
- Added `extractJsonBlock` helper in `taskWorkflow.ts` to replace `LlmJson` dependency (regex-based JSON extraction from raw LLM output)
- Stripped `taskWorkflowActions.ts` down to only `createPullRequest` (removed `runAudit`, `LlmJson`, `Daytona` imports)

## Resizable console/terminal panel in session preview — 2026-02-17

- Replaced fixed `h-64` console/terminal drawer with a draggable resizable panel using `react-resizable-panels`
- When `showConsole` is true, the preview area splits into a vertical `Group` with a drag handle between the iframe and the console/terminal tabs
- Preview panel defaults to 70%, console/terminal to 30%, with min 80px each and max 400px for the bottom panel
- When `showConsole` is false, the iframe fills the full space (no panel group mounted)
- Tab content uses `flex-1 min-h-0` instead of fixed `h-64` so it fills whatever size the user drags to
- Added `data-[state=inactive]:hidden` on `forceMount` `TabsContent` to fix both panels being visible simultaneously
- Drag handle has a subtle `IconGripHorizontal` indicator and highlights on hover/active

## SearchInput component + PageWrapper centering fix — 2026-02-17

- Added `inputClassName` prop to `SearchInput` for sidebar-specific border/bg styling
- Fixed `PageWrapper` `headerCenter` to use absolute positioning so the search bar stays visually centered regardless of title/right content width
- Migrated all 7 inline search bar instances to use `SearchInput`:
  - `ProjectsClient`, `QuickTasksClient` (page headers)
  - `TestingArenaClient` DocsListPanel, `DocsList` (panel search)
  - `AnalyseSidebar`, `SessionsSidebar`, `DesignSessionsSidebar` (sidebar search with custom sidebar styling via `inputClassName`)

## Migrate Session Execute from Inngest to Convex Workflows — 2026-02-17

- Migrated `sessionExecute` (execute, ask, plan modes) from Inngest to Convex Workflows with fire-and-forget sandbox pattern
- Created `sessionWorkflow.ts` with single unified workflow handling all 3 modes, prompt builders, diff parsing, and supporting internal functions
- Added `runSandboxCommand` internalAction to `daytona.ts` for post-completion sandbox operations (git diff capture, plan.md reading)
- Updated `getOrCreateSandbox` in `daytona.ts` to sync repo (fresh GitHub token + git pull) when reusing existing sandboxes
- Execute mode captures git diffs via `runSandboxCommand` after Claude completes, plan mode reads `plan.md` content
- Workflow supports cancel via `workflow.cancel` — replaces Inngest `cancelOn` event pattern
- Updated web ChatPanel.tsx to use Convex mutations (`startExecute`, `cancelExecution`) instead of `fetch("/api/inngest/send")`
- Updated chrome extension ChatPanel.tsx to call Convex mutation directly instead of Inngest API endpoint
- Deleted `session-execute.ts` and removed from Inngest route registration
- Remaining Inngest functions: executeTask, buildProject, startSandbox, stopSandbox, cleanupProjectSandbox

## Migrate Research Query Workflows from Inngest to Convex — 2026-02-17

- Migrated `generateResearchQuery` and `confirmResearchQuery` from Inngest to Convex Workflows with fire-and-forget sandbox pattern
- Created `researchQueryWorkflow.ts` with both workflows, shared completion event, prompt builders, and all supporting internal functions
- Added `extraEnvVarNames` arg to `setupAndExecute` in `daytona.ts` — workflows specify env var names, the action reads values from `process.env` (keeps secrets out of workflow args)
- Added missing sandbox env vars (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_ENV`) to `createSandbox` to match Inngest parity
- Confirm workflow reuses the sandbox from the generate step via `sandboxId` stored on the research query document, avoiding redundant sandbox creation
- Added `activeWorkflowId` and `sandboxId` fields to `researchQueries` schema
- Updated `QueryDetailClient.tsx` to use Convex mutations with `getWorkflowTokens` instead of `fetch("/api/inngest/send")`
- Added ActivitySteps streaming UI to the research query page
- Deleted `execute-research-query.ts` and removed both functions from Inngest route
- Remaining Inngest functions: executeTask, buildProject, sessionExecute, startSandbox, stopSandbox, cleanupProjectSandbox

## Migrate 6 Remaining Inngest Functions to Convex Workflows — 2026-02-16

- Migrated `summarizeSession`, `docPrdUpload`, `evaluateDoc`, `docInterview`, `interviewQuestion`, and `generateTests` from Inngest background jobs to Convex Workflow (`@convex-dev/workflow`)
- Generalized `daytona.ts` with shared utilities: `buildCallbackScript(completionMutation, entityIdField)`, `launchScript(sandbox, prompt, ...)`, `setupBranch(sandbox, branchName)`, and a new generic `setupAndExecute` internalAction used by all workflows
- Created shared `getWorkflowTokens(installationId)` server action in `apps/web/app/(main)/[repo]/actions.ts`, replacing per-feature token fetching
- Split interview workflows (docInterview, projectInterview) into separate question and generate/spec workflows, with `ready: true` detection on the frontend triggering the second phase
- Added `activeWorkflowId` field to sessions, docs, projects, and evaluationReports tables for workflow event routing
- Replaced all `fetch("/api/inngest/send")` calls in 8 frontend files with direct Convex mutation calls
- Deleted 6 Inngest function files and removed their exports/registrations from `inngest/index.ts` and `api/inngest/route.ts`
- Remaining Inngest functions: executeTask, buildProject, sessionExecute, startSandbox, stopSandbox, cleanupProjectSandbox, generateResearchQuery, confirmResearchQuery

## Migrate Design Sessions from Inngest to Convex Workflow — 2026-02-16

- Migrated design session execution from Inngest background jobs to Convex Workflow (`@convex-dev/workflow`) for durable orchestration with retry/timeout semantics
- Moved all sandbox operations (Daytona SDK calls, Claude CLI execution) into `packages/backend/convex/daytona.ts` as a Convex `internalAction`
- Sandbox callback now authenticates via Clerk JWT token passed through the workflow chain, calling Convex mutations directly via the HTTP API (`POST /api/mutation`) with `Authorization: Bearer <jwt>`
- Removed custom HTTP endpoints (`http.ts`) and callback token storage — auth is handled by Clerk, not custom tokens
- Moved GitHub App token generation to a Next.js server action (`getDesignTokens`) since `@octokit/auth-app` crypto doesn't work in Convex's Node.js runtime
- Moved design prompt building logic from `apps/web/lib/prompts/designPrompts.ts` into `packages/backend/convex/designWorkflow.ts` to keep it co-located with the workflow
- Created `WorkflowManager` singleton (`workflowManager.ts`) with retry defaults (3 attempts, exponential backoff)
- Removed `callbackTokens` table and `callbackToken` field from `designSessions` schema
- Deleted `apps/web/lib/inngest/functions/design-execute.ts` and removed design exports from Inngest config
- Added `convex` to Dockerfile global install + `NODE_PATH` for future sandbox script improvements

## Activity Steps — Chain of Thought UI for Streaming Logs — 2026-02-13

- Installed Chain of Thought component from AI Elements SDK into `packages/ui/src/ai-elements/chain-of-thought.tsx`
- Created `ActivitySteps` wrapper component with custom step types (read, edit, write, bash, search_files, search_code, web_fetch, web_search, subtask, notebook, tool) and icon mapping
- Modified `runClaudeCLIStreaming` in sandbox.ts to accumulate structured `ActivityStep[]` objects instead of flat text, storing JSON in `currentActivity` and `activityLog`
- Created `parseActivitySteps` utility for backward-compatible parsing (JSON or legacy plain text)
- Updated `ChatPanel.tsx` (sessions) to render steps via `<ActivitySteps>` for both real-time streaming and historical activity logs
- Updated `ProjectTaskDetailPanel.tsx` (project tasks) to render steps via `<ActivitySteps>` for real-time streaming display
- Replaced raw text activity logs with a step-by-step Chain of Thought UI showing each tool call (read, edit, write, bash, search, etc.) as a distinct step with icons and status indicators
- Backend now accumulates structured steps during Claude CLI execution instead of flat text strings
- Sessions chat panel and project task detail panel both display the new step-by-step UI for real-time streaming and historical logs
- Old session data with plain-text logs continues to render correctly via automatic fallback

## Restyle to shadcn Nova + Neutral + Teal — 2026-02-12

- **CSS Variables**: Neutralized all teal-tinted grays (foreground, card-foreground, popover-foreground, sidebar colors) to pure neutral (0 chroma) in both light and dark mode. Updated primary hue from 178° to 183.788° to match shadcn teal preset. Reduced `--radius` from 0.75rem to 0.625rem. Darkened dark mode background from 0.182 to 0.145, bumped muted-foreground to 0.708 for better contrast.
- **UI Primitives (packages/ui)**: Applied Nova compact sizing — buttons (h-10→h-9, h-9→h-8, h-11→h-10), inputs (h-10→h-9), tabs (h-9→h-8), card padding (p-6→p-5), dialog (gap-5 p-7 rounded-2xl → gap-4 p-6 rounded-xl), badge (rounded-full→rounded-md), dropdown items (rounded-lg→rounded-sm, py-2→py-1.5), popover (rounded-xl→rounded-lg, p-4→p-3). Removed glass effects from dropdowns/popovers (no more /bg-popover/90).
- **App Components**: Compacted PageWrapper (px-5→px-4, py-3→py-2.5, title text-xl→text-lg), Container gaps/padding reduced by 1 step, EmptyState (py-20→py-16, icon w-14→w-12), SidebarLayoutWrapper headers reduced, Sidebar nav items (py-2.5→py-2), kanban column/board gaps, project cards (p-4→p-3), quick task cards (p-3→p-2.5), docs list items, active tasks accordion trigger.
- **Page Layouts**: Repo layout rounded-l-2xl→rounded-l-xl, sidebar item padding reduced across sessions/design/analyse/admin layouts, inbox item padding reduced, repos grid gap reduced.
- **Chrome Extension**: Synced all CSS variables to match web app — neutralized grays, updated primary hue, reduced radius from 1rem to 0.625rem.

## Apple Design System Overhaul — Neutral Palette, Glass Effects, Pill Shapes — 2026-02-12

- **Phase 1 — Design Foundations**: Shifted all teal-tinted grays to pure neutral grays (light + dark mode), softer diffused shadows (Apple-style barely-there depth), bumped `--radius` to 14px, tighter letter spacing (-0.02em), added `.glass` utility for frosted glass surfaces
- **Phase 2 — Layout & Navigation**: Sidebar gets frosted glass effect on desktop, nav items use explicit teal for active state (`bg-primary/10 text-primary`), taller nav items (40px), rounder pill shape (`rounded-lg`), stronger hover feedback, more breathing room in group headers, footer divider, page titles bumped to `text-xl`, increased padding throughout PageWrapper and Container, sidebar layout width to 320px, content area rounded to `rounded-l-2xl`
- **Phase 3 — Components**: Cards `rounded-xl`, buttons `rounded-lg` with taller sizes (h-10 default), badges pill-shaped (`rounded-full`), inputs taller with `rounded-lg`, dialogs `rounded-2xl` with lighter overlay + stronger blur, popovers/dropdowns get glass effect (` bg-popover/90`), dropdown items `rounded-lg` with more padding, tabs get active shadow lift, empty state larger icon container + title, kanban columns more padding + gap, quick task cards subtler shadow, project cards rounder with hover shadow

## Apple Design Philosophy Pass — Border Reduction, Frosted Glass, Selection Styling — 2026-02-12

- Removed `border-b border-border` from PageWrapper header — sections now separated by whitespace and typography hierarchy
- Removed `border-b border-border` from both SidebarLayoutWrapper headers (mobile + desktop) — same Apple-style space separation
- Removed `border-t border-sidebar-border` from Sidebar bottom user section — reduces visual noise
- Added ``to Dialog overlay for Apple's frosted glass effect, lightened overlay from`bg-black/50`to`bg-black/40`
- Bumped Dialog content from `rounded-md` to `rounded-lg` for Apple's generous modal corner radius
- Added `::selection { background: rgb(var(--primary) / 0.15) }` for tinted text selection highlighting

## Apple/Linear Design Polish — Rounder Corners, Better Spacing, Font Smoothing — 2026-02-12

- Bumped global `--radius` from `0.5rem` to `0.625rem` (both light and dark themes) — cascades through all UI primitives: `rounded-md` is now 8px (was 6px), `rounded-lg` is 10px (was 8px)
- Added `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` to body for Apple-style text rendering
- Increased PageWrapper header/content padding from `px-4 py-2.5`/`px-4 py-2` to `px-5 py-3` for more breathing room
- Increased SidebarLayoutWrapper header padding (`py-2.5` → `py-3`) and mobile top bar (`py-2` → `py-2.5`)
- Increased main sidebar nav item padding (`py-1.5` → `py-2`) and bottom section separation (`pt-3` → `pt-4`)
- Matched inner sidebar items to new nav density (`py-1.5` → `py-2`) across sessions, analyse, admin, design, docs, testing-arena, and active tasks accordion
- Increased card spacing: QuickTaskCard (`p-2` → `p-3`), ProjectCard (`p-3` → `p-4`), KanbanColumn header/content (`p-2` → `p-3`), RepoHome stat cards (`p-4` → `p-5`)
- Removed redundant `rounded-md` from KanbanColumn and ProjectCard (Card primitive now handles it at 8px)
- Increased kanban column gaps from `gap-2` to `gap-3` in both KanbanBoard and ProjectsClient
- Increased Container padding (`px-2 md:px-4 pt-2 md:pt-4` → `px-3 md:px-5 pt-3 md:pt-5`)
- Increased EmptyState generosity: `py-16` → `py-20`, icon `w-12 h-12` → `w-14 h-14`, spacing adjustments

## UI Consistency Pass — Inner Sidebars, Chat Bubbles, Page Density — 2026-02-12

- Standardized all inner sidebar list items (sessions, analyse, design, docs, testing-arena, admin) to match main sidebar: `rounded-md`, `py-1.5`, `duration-150`
- Tightened chat message bubbles from `rounded-2xl` to `rounded-xl` across sessions, analyse, design, and plan context panel
- Compacted repo home stats (smaller padding, text sizes, removed logo pill background)
- Tightened repo listing cards (`p-3`, `text-sm`, `duration-150`)
- Tightened inbox notification items (`py-2.5`, `rounded-md`, `duration-150`)
- Standardized all animation durations to 150ms (from mixed 200ms/300ms) across MultipleChoiceQuestion, QueryDetailClient, DesignDetailClient
- Reduced admin sidebar icon size from 20px to 16px to match rest of sidebar

## Linear/Notion-style UI Polish — 2026-02-12

- Tightened global `--radius` from `0.8rem` to `0.5rem` (both light and dark) — cascades through all buttons, cards, inputs, dialogs
- Neutralized border colors (`--border`, `--input`, `--sidebar-border`) from teal-tinted to neutral gray in both themes
- Sidebar: added `bg-sidebar` background + `border-r border-sidebar-border` separator, removed logo pill shape, compacted nav items (`rounded-md`, `py-1.5`, `text-[13px]`), added `border-t` on user section
- Sidebar active/hover states now use sidebar-specific tokens (`bg-sidebar-accent`, `text-sidebar-primary`)
- Group labels: `text-[11px] font-medium`, tighter spacing (`space-y-1` between groups, `space-y-px` between items)
- PageWrapper: added `border-b border-border` header separator, `text-base` title, `rounded-md` back button
- SidebarLayoutWrapper: added `border-r border-border` and `border-b border-border` to inner sidebar/headers, `text-base` titles
- Main content panels: `lg:rounded-l-xl` (tighter corner), `duration-150` transitions throughout

## Inbox Page + Projects Timeline View — 2026-02-12

- Created full-page `/inbox` route with its own layout (Sidebar + MainContent, no RepoProvider)
- Extracted shared `notification-config.tsx` (typeConfig, NotificationIcon, Notification type) from popover into `lib/components/notifications/`
- Refactored `NotificationsPopoverClient` to import from shared config and added "View all" link to `/inbox`
- Inbox page: All/Unread filter (nuqs), notification list with type icons, click-to-navigate + mark-as-read, "Mark all read" button
- Added Inbox nav item with unread count badge to sidebar bottom navigation
- Created `ProjectsTimeline` component: interactive drag-to-pan, Ctrl+scroll to zoom, pixel-based coordinate system with padded date range for exploring past/future
- Today marker (primary vertical line), phase-colored bars, click opens ProjectCardModal
- Added `deadline` field to projects schema, projectValidator, and update mutation
- Deadline date picker in ProjectCardModal sidebar (red-styled label)
- Deadlines render as red diamond markers with vertical line on the timeline, with tooltip showing date
- Added Kanban/Timeline view toggle to Projects page toolbar (nuqs-controlled `view` param)
- Both views share the same search, phase filter, and sort controls
- Added `inboxFilterParser` and `projectViewParser` to `search-params.ts`

## Project Card Modal — 2026-02-12

- Added `projectLead`, `members`, `startDate`, `endDate` optional fields to the `projects` schema
- Extended `projects.update` mutation to accept the new fields
- Created `ProjectCardModal` component with two-column layout: left shows description + progress bar, right sidebar has phase badge, project lead selector, members multi-select, and start/end date inputs
- Modified `ProjectCard` to open the modal on click instead of navigating directly (replaced `<Link>` with clickable `<div>`)
- "View Project" button in modal footer navigates to the full project page

## Post-Execution Audits for Quick Tasks — 2026-02-11

- Added `taskAudits` Convex table with status, accessibility/testing/codeReview arrays, and indexes by task and run
- Created `taskAudits.ts` with `getByTask` query, `create`/`complete`/`fail` mutations
- Added `run-audit` step to `execute-task.ts` — captures git diff before/after, runs Claude Haiku audit (read-only, no tools), parses structured JSON results
- Audit is best-effort: wrapped in try/catch so failures don't block task completion
- Added audit UI to `TaskDetailModal` — shows streaming progress while running, 3 accordion sections (Accessibility, Code Testing, Code Review) with pass/fail badges when complete

## Doc Interview Feature — 2026-02-11

- Added `interviewHistory` and `sandboxId` fields to `docs` table schema
- Added `addInterviewMessage`, `updateLastInterviewMessage`, `clearInterview`, `updateDocSandbox` mutations to `docs.ts`
- Created `doc-interview.ts` Inngest function mirroring project interview pattern (sandbox + Claude CLI streaming)
- Created `DocInterviewDialog` component with chat UI reusing `MultipleChoiceQuestion` and `ChatMessage`
- Added "Interview Me" button to `DocViewer` header that opens the interview dialog
- AI asks codebase-grounded questions then auto-generates description, requirements, and user flows

## Speech-to-Text Input for PromptInput — 2026-02-11

- Created `PromptInputSpeech` component in `packages/ui/src/ai-elements/prompt-input-speech.tsx` using native Web Speech API
- Renders a mic button that toggles speech recognition; returns `null` on unsupported browsers (Firefox/Safari)
- Appends final transcription results to the textarea via native value setter + input event dispatch
- Added speech button to sessions (`ChatPanel.tsx`), design (`DesignDetailClient.tsx`), and analyse (`QueryDetailClient.tsx`)
- Exported from `@conductor/ui`

## Persona Selector for Design Sessions — 2026-02-11

- Added `designPersonas` table to Convex schema with `name`, `prompt`, `repoId`, `userId` fields
- Added `selectedPersonaId` field to `designSessions` table
- Created `designPersonas.ts` with CRUD operations (list, get, create, update, remove)
- Added `selectPersona` mutation to `designSessions.ts`
- Created `PersonaSelector` component with popover dropdown and manage modal
- Updated `buildDesignPrompt` to inject persona context into AI prompt
- Updated `design-execute` Inngest function to fetch persona and pass to prompt builder

## Sandbox + CodeBlock AI Elements for Research Queries — 2026-02-11

- Created `CodeBlock` and `CodeBlockCopyButton` components in `packages/ui/src/ai-elements/code-block.tsx` — reusable code display with clipboard copy
- Created `Sandbox`, `SandboxHeader`, `SandboxContent`, `SandboxTabs`, `SandboxTabsList`, `SandboxTabsTrigger`, `SandboxTabContent` components in `packages/ui/src/ai-elements/sandbox.tsx` — collapsible container with status badges and tabbed content
- Updated `QueryDetailClient` pending state to use `CodeBlock` with copy button instead of plain `<pre><code>`
- Updated `QueryDetailClient` completed state to use `Sandbox` with Output/Code tabs instead of inline Collapsible "View query"
- Updated saved queries panel to use `CodeBlock` for consistent code display
- Exported all new components from `@conductor/ui`

## Model Selector for Task Execution — 2026-02-11

- Added `claudeModelValidator` (opus/sonnet/haiku) to Convex validators and optional `model` field to `agentTasks` schema
- Extended `agentTasks.update` mutation and `agentTaskValidator` to support `model` field
- Added `model` to `startExecution` return type so it flows to the Inngest event
- Added Model dropdown in TaskDetailModal sidebar (between Assign and Pull Request), defaulting to Sonnet
- Updated `execute-task.ts` to use `model` from event data instead of hardcoded `"sonnet"`

## Design Page — Skills, Icons, and Prompt Quality Improvements — 2026-02-11

- Pre-installed Claude Code plugins in Daytona sandbox Dockerfile: `anthropics/claude-plugins-official` (for `/frontend-design` skill) and `Dammyjay93/interface-design` (for `/interface-design` craft-focused design skill)
- Added `Skill` to allowed tools in `design-execute.ts` so Claude can invoke design skills before generating variations
- Updated design prompt to invoke 3 skills before generating: `/frontend-design` (production-grade aesthetics), `/interface-design` (craft + domain exploration), `/web-design-guidelines` (accessibility/WCAG)
- Added `lucide-react` as a Sandpack dependency — generated components can now use icons, which is the single biggest visual quality improvement
- Added "Available Libraries" section to prompt telling Claude what's available in the preview environment (lucide-react icon examples, Inter font weight/size guidance)
- Strengthened prompt rules: icons required on all clickable elements/headers, realistic content enforced, hover feedback on all interactive elements
- Added `"Skill"` to the `ClaudeTool` type union in `sandbox.ts`

### Learnings & Notes

**Plugin system structure**: Plugins live at `~/.claude/plugins/marketplaces/<name>/`, enabled via `~/.claude/settings.json` `enabledPlugins` field (format: `plugin-name@marketplace-name`). Marketplace repos have `.claude-plugin/marketplace.json`, standalone plugin repos have `.claude-plugin/plugin.json`.

**Dockerfile plugin pre-install**: Clone repos into `~/.claude/plugins/marketplaces/` and write a `settings.json` with `enabledPlugins`. Built-in skills (like `web-design-guidelines`) don't need installation.

**Test prompts for design page quality**:

1. "Design a project analytics dashboard with key metrics at the top (tasks completed, active contributors, sprint velocity, bugs filed), a line chart placeholder area, and a real-time activity feed showing recent commits, PR merges, and deployments with timestamps and user avatars"
2. "Create a settings page with a sidebar navigation (Profile, Notifications, Integrations, Billing, Security) and a main content area. Show the Notifications section with toggle switches for email digests, Slack alerts, and in-app notifications, each with a description and icon"
3. "Build a user management table with columns for name, email, role, status, and last active date. Include a search bar, role filter dropdown, bulk selection checkboxes, and a toolbar that appears when rows are selected with actions like Export, Deactivate, and Send Invite"
4. "Design a team inbox view. Include a toggle to switch between an empty state (no messages yet — show an illustration-like icon composition and a CTA to invite teammates) and a populated state with a message list, preview pane, and quick-reply input"
5. "Create a 3-step onboarding wizard for connecting a GitHub repository. Step 1: select organization and repo from a searchable list. Step 2: configure branch protection and review settings with checkboxes. Step 3: confirmation summary with an animated success state. Include a progress bar and back/next navigation"

## Annotation Card UX Improvements — 2026-02-11

- Added "Run Eva" button to existing annotation cards — triggers task execution from the annotation overlay without opening the sidepanel
- Regrouped footer buttons: new annotations show Cancel + Create Task; existing annotations show Run Eva (left) + Cancel + Edit Task (right)
- Fixed inverted dark/light color scheme in InputCard — dark mode now uses dark backgrounds, light mode uses light backgrounds
- Added creator avatar (Facehash) to annotation card header next to "Annotation #N"
- Content script stores `userId` and `creatorInitials` per pin, persisted across page reloads
- Sidepanel sends user data (Convex userId + initials from Clerk) with `ANNOTATION_TASK_CREATED` messages
- Replaced local `UserAvatar` component in ChatPanel with `UserInitials` from `@conductor/shared` (Facehash-based)
- Added `RUN_ANNOTATION_TASK` message type for single-task execution from content script
- Added `facehash` and `dayjs` dependencies to chrome extension (peer deps of `@conductor/shared`)

## Create `@conductor/shared` Package — 2026-02-10

- Created `packages/shared/` workspace package (`@conductor/shared`) for smart components and utilities shared between web and chrome-extension
- Moved `UserInitials` component from `apps/web/lib/components/ui/` to `packages/shared/src/components/`
- Moved `dates.ts` (dayjs with relativeTime) from `apps/web/lib/` to `packages/shared/src/utils/`
- Changed `UserInitials` `userId` prop from `string` to `Id<"users">` (removed internal `as` cast)
- Removed dead `avatar` variable and commented-out block from `UserInitials`
- Updated 22 import statements across `apps/web` to use `@conductor/shared` and `@conductor/shared/dates`
- Added `@conductor/shared` dependency to both `apps/web` and `apps/chrome-extension`

## Design Page Improvements — Prompt quality, iteration flow, UX - 2026-02-10

- Rewrote design prompt with explicit variation strategies (clean/conventional, creative/bold, compact/efficient) and design quality guidelines (realistic content, consistent spacing, visual hierarchy)
- Fixed codebase-reading instruction to clarify output runs in isolation — recreate style patterns, no project imports
- Stronger iteration prompt: preserves core layout/colors from selected base, only changes what user requests
- Added `selectedCode` and `selectedLabel` fields to `designSessions` schema — stores selected variation directly instead of fragile reverse-search through message history
- Reset `selectedVariationIndex`/`selectedCode`/`selectedLabel` when new variations arrive (fixes stale selection across batches)
- Auto-select current tab when user sends follow-up without clicking "Use this design"
- Added "Using as base" indicator below chat when a variation is selected
- Added hint text when variations exist but none selected
- Added check icon on selected variation tab
- Better loading state in preview panel: Spinner + streaming activity text instead of plain "Generating designs..."
- Added suggestion chips after first generation ("Make it more minimal", "Add more whitespace", "Make the colors bolder")
- Simplified Inngest `design-execute.ts` selectedBase lookup to use stored `selectedCode`/`selectedLabel`

## Annotation UX Flow Refinements - 2026-02-10

- Simplified InputCard to single primary action: "Create Task" (new) or "Edit Task" (existing) — removed standalone "Save" button
- Locked editing for in-progress/business_review/code_review pins: textarea becomes read-only, footer hidden, delete hidden
- Annotations now immediately delete when task status becomes "done" (task record persists in web app)
- Removed `handleInputSave`, `hiddenDonePins` state, and 5-second auto-hide logic

## Chrome Extension UI Improvements — Annotation pins, toolbar, and status sync - 2026-02-10

- Changed annotation cursor from purple to teal theme color (`#109182`)
- Scaled annotation pins 1.25x (24px → 30px) with proportional font/offset/shadow adjustments
- Added status-colored pins: grey (todo), yellow (in_progress), orange (business_review), purple (code_review), grey at 40% opacity (done)
- Pins now persist after "Create Task" instead of being deleted — marked as `todo` with grey color
- Added `taskId` and `status` fields to `StoredPin` for tracking linked tasks
- Added `getStatusesByIds` Convex query for batch task status lookups
- Added real-time status sync: `AnnotationTool` subscribes to task statuses via Convex and pushes updates to content script pins
- Done pins fade to 40% opacity then auto-hide after 5 seconds (remain in storage)
- Replaced "Add all to Quick Tasks" toolbar button with "Run All" — creates tasks AND triggers execution via Inngest
- Increased toolbar size (padding, gaps, fonts, dividers, eye button) for Vercel-inspired look
- Added 5 new message types: `ANNOTATION_TASK_CREATED`, `ANNOTATION_STATUS_SYNC`, `RUN_ALL_ANNOTATIONS`, `RUN_ALL_RESULT`, `TaskStatus` type

## Fix session editor tab + audit cleanup - 2026-02-10

**Problem:** The editor tab in sessions showed nothing — code-server was being downloaded fresh (~100MB+) via `npx -y code-server@latest` every sandbox start, which exceeded the 30s exec timeout and silently failed as a backgrounded process.

**Solution — pre-install code-server in the snapshot image:**

- Added `curl -fsSL https://code-server.dev/install.sh | sh` to the Dockerfile (as root, before `USER eva`) to bake code-server into the `eva-snapshot`
- Used the official install script instead of `npm install -g` because code-server has native deps that need build tools not in the base image — the script downloads pre-built binaries
- Updated `session-sandbox.ts` startup command from `npx -y code-server@latest` to just `code-server` (pre-installed binary), reduced timeout from 30s to 10s

**Architecture decision — why code-server:**

- VS Code is a desktop Electron app, can't run in a browser directly — all browser solutions are HTTP servers serving the VS Code web UI in an iframe
- Evaluated code-server (Coder), OpenVSCode Server (Gitpod), and `code serve-web` (official Microsoft) — all work identically (HTTP server on a port → iframe)
- Chose code-server: most popular, well-documented, no commercial license restrictions

**How the editor tab works end-to-end:**

- Sandbox starts → `code-server --port 8080 --auth none --bind-addr 0.0.0.0 /workspace/repo` runs in background
- `EditorPanel.tsx` polls `GET /api/sessions/preview?port=8080&check=1` every 3s (up to 20 attempts)
- Preview route gets a signed Daytona proxy URL (`sandbox.getSignedPreviewUrl(8080, 3600)`) and runs `curl localhost:8080` inside the sandbox to verify readiness
- Once ready, the signed URL loads in a full-screen iframe with clipboard permissions

**Audit fixes:**

- Fixed broken JSX in EditorPanel where "Starting editor..." text and "Retry" button rendered unconditionally (were outside their `{isLoading && ...}` and `{error && ...}` blocks)
- Fixed sandbox reconnect path to restart both code-server and dev server (previously only checked sandbox liveness without restarting services killed by Daytona auto-stop)
- Fixed stale iframe URL not being cleared when editor re-polls after retry or sandbox reconnect

## Add Editor tab (code-server) to session sandbox panel - 2026-02-10

- Added "editor" tab to the SandboxPanel alongside existing Preview and Diffs tabs
- code-server is installed and started on port 8080 during new sandbox creation (runs alongside `pnpm dev`)
- Created `EditorPanel.tsx` — fetches signed URL from existing preview API with `port=8080` and renders code-server in an iframe
- No new API routes needed — reuses existing `/api/sessions/preview` route which already accepts a `port` parameter

## Migrate local state to nuqs URL state management - 2026-02-09

- Installed nuqs and added NuqsAdapter to the client provider tree
- Created centralized `lib/search-params.ts` with typed parsers for all URL params (search, filters, sort, tabs, modes)
- Migrated search bars from useState to useQueryState in KanbanBoard, ProjectsClient, DocsList, TestingArenaClient
- Migrated Set-based column/phase filters from useState to useQueryStates with array parsers in KanbanBoard and ProjectsClient
- Migrated sort field + direction from useState to useQueryStates in ProjectsClient
- Migrated time range filter from useState to useQueryState in AnalyticsClient
- Migrated tab switching from useState to useQueryState in SandboxPanel (preview/diffs), ChatPanel (execute/ask/plan), DesignDetailClient (variation + device), and testing-arena doc page (code/ui)
- All search/filter state now persists in the URL, enabling shareable links, page refresh persistence, and browser back/forward navigation

## Replace OpenRouter with Claude Code CLI + Daytona for research queries - 2026-02-09

- Replaced paid OpenRouter GPT-5-nano API calls with Claude Code CLI running inside ephemeral Daytona sandboxes, using the free Claude Max subscription (`CLAUDE_CODE_OAUTH_TOKEN`)
- Both Inngest functions (`generateResearchQuery` and `confirmResearchQuery`) now spin up sandboxes instead of calling OpenRouter
- Query execution uses Bash tool inside the sandbox to POST to Convex's `/api/run_test_function` endpoint via a node.js script
- Removed `ai` SDK, OpenRouter, and Zod dependencies from the research query module

## Install AI Elements WebPreview + Plan components - 2026-02-09

- Added `WebPreview`, `WebPreviewNavigation`, `WebPreviewNavigationButton`, `WebPreviewUrl`, `WebPreviewBody`, `WebPreviewConsole` components to `packages/ui/src/ai-elements/web-preview.tsx` (ported from AI Elements registry)
- Added `Plan`, `PlanHeader`, `PlanTitle`, `PlanDescription`, `PlanAction`, `PlanContent`, `PlanFooter`, `PlanTrigger` components to `packages/ui/src/ai-elements/plan.tsx` (ported from AI Elements registry)
- Added `CardAction` to `packages/ui/src/ui/card.tsx` (required by Plan component)
- Refactored `WebPreviewPanel.tsx` to use AI Elements `WebPreview` component with composable nav bar, URL display, and iframe body
- Moved address bar from `SandboxPanel.tsx` into `WebPreviewPanel.tsx`, simplifying SandboxPanel
- Replaced PRD Dialog modal in `ChatPanel.tsx` with inline collapsible `Plan` component above the prompt input (shows plan content with "Approve Plan" button when in PRD mode)

## Replace manual patterns with UI components (Chrome Extension) - 2026-02-08

- Replaced manual spinner div with `Spinner` component in App.tsx loading state
- Replaced raw `<input>` with `Input` component for project title field in App.tsx
- Replaced raw `<button>` project selector items with `Button` component in App.tsx
- Replaced 2 manual avatar divs with `Avatar`/`AvatarFallback` in ChatPanel UserAvatar component
- Replaced raw close `<button>` + inline SVG with `Button` + `IconX` in ContextPreview
- Replaced raw `<button>` session list items with `Button` component in SessionSidebar

## Design Page with Sandpack Live React Previews - 2026-02-08

- Added `/design` page for AI-powered UI design generation
- New `designSessions` Convex table with message variations (`{ label, code }` per design)
- Convex CRUD functions for design sessions (list, get, create, addMessage, updateLastMessage, selectVariation, updateSandbox, archive)
- Inngest `design-execute` function: reads codebase in sandbox, generates 3 design variations via Claude CLI
- Design prompt generates live React components using `import { useState } from 'react'` + `export default function App()`
- Sandpack preview uses `externalResources` for Tailwind CDN + Google Fonts, with custom `/styles.css` (CSS variables) and `/setupTailwind.js` (theme config)
- Extracted shared `lib/tailwind-theme.js` — single source of truth for theme extend (colors, borderRadius, fontFamily), imported by both `tailwind.config.js` and the Sandpack config generator
- CSS variables read from `globals.css` at render time via `fs.readFileSync` in the server component — no hardcoded duplicates
- Code modal: "Code" button in toolbar opens a Dialog with the component source (replaced side-by-side code editor)
- Frontend: SidebarLayoutWrapper layout with session list, detail page with chat panel + full-width Sandpack preview
- Added "Design" link to sidebar BUILD group

## Replace manual div patterns with UI components - 2026-02-08

- Replaced manual spinner div with `Spinner` component in testing-arena report card
- Replaced manual progress bar div with `Progress` component in testing-arena
- Replaced raw `<button>` toggle with `Button` component in testing-arena
- Replaced card-like div with `Card`/`CardContent` in saved-queries page
- Replaced 5 raw `<button>` elements with `Button` component in RepoSetupClient (add, add all, done, back)
- Replaced manual loading spinner (`IconLoader2`) with `Spinner` component in RepoSetupClient
- Replaced raw refresh `<button>` with `Button` in SandboxPanel
- Replaced 2 manual avatar divs with `Avatar`/`AvatarFallback` in PlanContextPanel
- Replaced manual avatar div with `Avatar`/`AvatarFallback` in ChatPanel
- Replaced manual avatar div with `Avatar`/`AvatarFallback` in QueryDetailClient
- Replaced notification count `<span>` with `Badge` component in NotificationsPopoverClient

## Flat minimal UI redesign — Inset panel design - 2026-02-08

- Added `bg-card lg:rounded-l-2xl` to MainContent in repo layout for inset panel effect (content area has curved left edge against sidebar)
- Removed `border-r` from main Sidebar and `border-t` from sidebar user section
- Removed `border-b` header border and redundant `bg-background`/`bg-card` from PageWrapper (parent now handles backgrounds)
- Removed all `border-r`/`border-b` from SidebarLayoutWrapper (mobile header, mobile drawer, desktop sidebar)
- Removed structural borders from 6 project components: ProjectActiveLayout, ProjectTabs, ProjectPlanTab, ProjectTaskDetailPanel, ProjectChatTab, PlanContextPanel
- Removed structural borders from SpotlightSearch, TaskDetailModal, SandboxPanel, DiffPanel, QueryDetailClient
- Kept borders on interactive elements (inputs, buttons, accordion items) and timeline indicators

## Design audit #2 — semantic color token system + consistency sweep - 2026-02-08

### Phase 1 — Status color tokens & critical fixes

- Added 17 new CSS variables (light + dark) for 4-status color system: `--status-progress`, `--status-business-review`, `--status-code-review`, `--status-done` — each with DEFAULT, bg, subtle, and bar variants
- Added `--warning-bg` and `--success-bg` tokens for callout backgrounds
- Registered all status tokens in tailwind.config.js under `colors.status`
- Replaced all hardcoded yellow/orange/purple/green in `TaskStatusBadge.tsx` and `ProjectPhaseBadge.tsx` with semantic status tokens
- Replaced all `text-amber-*`/`bg-amber-*` warning colors across 5 files (sessions/layout, ProjectsClient, QuickTasksKanbanBoard, TaskDetailModal, ProjectTaskDetailPanel) with `text-warning`/`bg-warning`/`bg-warning-bg` tokens
- Replaced presence indicator colors in `UserInitials.tsx` (`bg-emerald-500` → `bg-success`, `bg-amber-500` → `bg-warning`)
- Standardized 4 empty state pages (sessions, analyse, docs, testing-arena) to use `EmptyState` component
- Eliminated all `text-foreground/80` opacity modifiers across 8 files → `text-muted-foreground`

### Phase 2 — Refinement

- Replaced Spinner loading with Skeleton loaders in ProjectsClient and QuickTasksClient
- Standardized all dialog cancel buttons from `variant="secondary"` to `variant="ghost"` across 7 files
- Fixed search icon position in sessions/layout (`left-2.5` → `left-3`)
- Replaced custom `<button>` elements with `<Button>` component in sessions/layout, QuickTaskCard, and analyse/layout

### Phase 3 — Remaining hardcoded colors

- Replaced all `text-green-600`/`bg-green-600` in ChatPanel.tsx (5 instances) with `text-success`/`bg-success text-success-foreground`
- Replaced `bg-green-100 dark:bg-green-900/30` and `text-green-700 dark:text-green-400` in DependencyBadge with `bg-status-done-bg`/`text-status-done`
- Replaced `text-emerald-600 dark:text-emerald-400` in ProjectFinalizationModal and ProjectPlanTab with `text-success`
- Replaced `bg-emerald-50 dark:bg-emerald-900/20` in ProjectPlanTab with `bg-success-bg`
- Replaced `text-emerald-500` in ProjectTaskCard with `text-success`
- Replaced `text-green-600` in RepoSetupClient with `text-success`
- Left DiffPanel git diff colors (green/red/blue) and Leaderboard medal colors (gold/bronze) as intentionally decorative

## Design audit #1 — 3-phase UI consistency overhaul - 2026-02-08

### Phase 1 — Critical fixes

- Replaced 14 manual spinner `<div>` elements with unified `<Spinner>` component across all loading states
- Fixed sidebar group labels from `text-[10px] text-muted-foreground/60` to `text-[11px] text-muted-foreground` for WCAG accessibility
- Standardized icon sizing: converted all `w-N h-N` className patterns to Tabler `size` prop across sidebar, layouts, and components
- Differentiated `--muted` token from `--secondary` in light mode (was identical `rgb(236, 245, 243)`, now `rgb(240, 244, 243)`)
- Eliminated non-standard opacity modifiers (`text-muted-foreground/60`, `text-foreground/70`, `bg-muted/30`) — replaced with full semantic tokens
- Added mobile responsiveness to `SidebarLayoutWrapper` — overlay drawer on mobile, existing sidebar on desktop

### Phase 2 — Refinement

- Standardized PageWrapper header padding to `py-3` (was `py-2.5`)
- Simplified sidebar navigation: removed collapsible groups (4 toggleable sections for 6 items → flat list with non-interactive section labels)
- Added `--success` and `--warning` semantic color tokens to globals.css (light + dark) and tailwind.config.js
- Updated badge `success`/`warning` variants from hardcoded emerald/amber with `dark:` overrides to `bg-success/10 text-success` semantic tokens
- Standardized all collapsed panel widths to `w-12` (was inconsistent: `w-10` in secondary sidebar, chat, query panel)
- Removed `mr-2` from 11 button icons — buttons already have `gap-2` built in

### Phase 3 — Polish

- Added `Skeleton` component and replaced spinner loading states with skeleton loaders for repo home stats, session list, and analyse query list
- Elevated `EmptyState` component: larger icon in rounded circle, `text-base` title, proper `Button` for action, more generous padding
- Added `border-b border-border` to PageWrapper header for clear visual separation from content
- Removed dead `shadow-none` class from StatCard (Card has no shadow by default)
- Removed hardcoded hex color props from StatCard sparklines (gradient already used `var(--muted-foreground)`)
- Fixed PageWrapper `headerCenter` from fragile absolute positioning to flexbox layout (prevents overlap on narrow viewports)

## Teal theme + fix broken opacity modifiers - 2026-02-08

- Changed theme color from purple to aqua/teal across web app and chrome extension (globals.css, chrome extension index.css, 3 overlay files with hardcoded hex)
- Lightened dark mode backgrounds (~5 RGB units brighter) after user reported "too dark"
- Fixed all broken `bg-primary/XX` Tailwind opacity modifiers (invalid CSS because CSS vars contain full `rgb()` values) — replaced with solid `bg-accent` token across 11 files: SpotlightSearch, MultipleChoiceQuestion, GroupTasksModal, ProjectPhaseBadge, PlanContextPanel, RepoHomeClient, ProjectChatTab, QuickTaskCard, ProjectTaskCard, RepoSetupClient
- Added missing hover states to QuickTaskCard and ProjectTaskCard (`hover:shadow-md hover:brightness-[0.97] dark:hover:brightness-110`)

## ChatGPT-inspired UI modernization - 2026-02-08

- Replaced card-on-card secondary sidebars with clean border separators (SidebarLayoutWrapper) — affects Sessions, Analyse, Admin, Testing Arena, and Docs layouts
- Added border-right to main sidebar and border-top footer separator for cleaner visual structure
- Slimmed PageWrapper header padding for a lighter, less chrome-heavy feel
- Migrated all 50 files with hardcoded `neutral-*` Tailwind colors to semantic design tokens (`bg-secondary`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.)
- Eliminated all `dark:bg-neutral-*` / `dark:text-neutral-*` paired classes — dark mode now handled entirely by semantic tokens
- Updated RepoHome stat cards, repo listing cards, welcome banner, and empty states to use semantic tokens

## Replace neutral-\* colors with semantic design tokens (batch 2) - 2026-02-08

- Replaced all hardcoded `neutral-*` Tailwind classes with semantic tokens across 15 files
- Files: SpotlightSearch, NotificationsPopoverClient, ThemeToggleClient, TaskDetailModal, TaskStatusBadge, ChatMessage, MultipleChoiceQuestion, Leaderboard, StatCard, PRsOverTimeChart, ActivityTimelineChart, SessionFunnel, KanbanColumn, ProjectPhaseBadge, RepoContext
- Mapping: `bg-neutral-50/100` -> `bg-secondary`, `bg-neutral-800/900/950` -> `bg-secondary`/`bg-background`, `text-neutral-400/500/600` -> `text-muted-foreground`, `text-neutral-900`/`text-white` (theme) -> `text-foreground`, `border-neutral-*` -> `border-border`, `hover:bg-neutral-*` -> `hover:bg-muted`, `bg-white dark:bg-neutral-900` -> `bg-card`/`bg-background`
- Collapsed light+dark variant pairs into single semantic tokens (dark mode handled automatically)

## Soft UI sidebar redesign - 2026-02-08

- Bumped global `--radius` from `0.75rem` to `1rem` for rounder, softer geometry across all components
- Gentler hover states on nav items and task list (`bg-muted/40` instead of `bg-muted/60`)
- More generous vertical padding on nav links (`py-2.5`) for a spacious, comfortable feel
- Softened active tasks accordion: gentler hover, more padding on task items
- Softened branch selector: lighter loading state bg (`bg-muted/30`), ghost sync button, wider gap
- Kept grouped navigation structure (BUILD/FIX/TEST/DATA) intact
- **All SidebarLayoutWrapper consumers updated** to Soft UI:
  - Sessions layout: replaced all `neutral-*`/`dark:` overrides with semantic tokens, added `rounded-xl` + `mx-2` on session items
  - Analyse layout: same treatment on query items and resource links (Saved queries, Routines, Files)
  - Admin layout: nav items now use `hover:bg-muted/40` and `text-muted-foreground`, icon color inherits from parent
  - Testing Arena: doc list items get `rounded-xl` + softer hover, empty states use `text-muted-foreground`
  - DocsList component: same rounded items + semantic color treatment

## Session PRD mode + Project active layout redesign - 2026-02-08

### Session PRD mode (was "Plan mode")

- Renamed Plan mode to PRD mode across the UI (tab label, mode badge, input placeholder, modal title, "View PRD" button)
- Updated the plan prompt in `session-execute.ts` from technical implementation plan to product-focused PRD (Overview, Goals, User Stories, Acceptance Criteria, Scope, Out of Scope)
- Prompt now instructs Claude to write for a non-technical audience — focus on WHAT to build and WHY, not HOW
- Execute mode now includes the approved PRD as context when `planContent` exists, so Claude follows the requirements when implementing
- Documented Sessions vs Projects distinction in `CLAUDE.md` and `internal/sessions-vs-projects.md`

### Project active layout redesign

- **Task-driven navigation**: Clicking a task in the left panel selects it and shows its details in the center panel (description, subtasks, agent runs with streaming activity). Previously the center was a "Sandbox (coming soon)" placeholder.
- **Progress bar**: Added `ProjectProgressBar` shared component used by both `ProjectCard` and `ProjectActiveLayout`. Color-segmented bar showing per-status counts (todo/in_progress/business_review/code_review/done) with tooltip breakdown. Replaces the basic green bar.
- **Chat panel hidden by default**: Chat is now fully hidden when closed (not a collapsed strip). Opens via chat button in the task detail header. Close button is an X on the right end with "Chat" title on the left.
- **Chat input upgraded**: Replaced custom Textarea/Button form with `PromptInput` components from `@conductor/ui` (matching sessions and query pages).
- **View Plan/Chat buttons moved to page header**: `PlanContextPanel` now renders in the header next to branch name and PR link (only for active/completed projects), removed from inside the tasks panel.
- **Task detail center panel**: New `ProjectTaskDetailPanel` component shows task number, title, status badge, description, subtasks, agent runs with streaming. Has "Open full details" button to open the existing `TaskDetailModal` for editing, and "Open chat" button to expand the chat panel.
- **Task selection highlighting**: Selected task card shows `ring-2 ring-primary` border in the task list.

**Justification**: Sessions and Projects had overlapping UIs (both had chat + sandbox). The redesign makes the project active layout task-driven (dashboard feel) vs session layout which is chat-driven (IDE feel). This matches the conceptual distinction: sessions are interactive pair programming, projects are autonomous task execution with monitoring.

## Saved queries feature - 2026-02-08

- Added optional `researchQueryId` to `savedQueries` schema to link back to source conversation
- Added save button in the "View query" collapsible on research query results (shows "Saved" state if already saved)
- Right panel in query detail page now lists all saved queries with title, preview, and delete
- Implemented `/saved-queries` page with full list view, collapsible query code, delete, and empty states

## Research query confirmation flow - 2026-02-08

- Split `research/query.execute` Inngest event into two: `research/query.generate` (generates query code without executing) and `research/query.confirm` (executes confirmed query and returns analysis)
- Added `queryCode` and `status` (pending/confirmed/cancelled) optional fields to research query messages in schema
- Added `updateMessageStatus` Convex mutation for confirm/cancel actions
- Updated `QueryDetailClient` to show generated query code with Run/Cancel buttons when status is "pending"
- Cancel directly updates message status via Convex mutation; Confirm triggers execution via Inngest

## Share Convex backend as a workspace package (`@conductor/backend`) - 2026-02-07

- Created `backend/index.ts` exporting `api`, `internal`, `Id`, `Doc`, `DataModel`, `TableNames` from Convex's generated types
- Added `@conductor/backend` as a workspace dependency in web and chrome-extension
- Deleted `web/api.ts` (~1,850 lines) and `chrome-extension/src/api.ts` (~1,850 lines) — replaced with direct imports from `@conductor/backend`
- Updated ~63 files across web and chrome-extension to import `api` and `Id` from `@conductor/backend` instead of `@/api` and `convex/values`
- Removed `convex-helpers ts-api-spec` generation scripts from web, chrome-extension, and root package.json
- Removed `convex-helpers` devDependency from chrome-extension (no longer needed)
- Fixed unused vars in backend `auth.ts` and `taskDependencies.ts` surfaced by chrome-extension's strict tsconfig

## Replace `@streamdown/code` with custom 4-language shiki code highlighter - 2026-02-07

- Created `packages/ui/src/lib/code-highlighter.ts` using `shiki/core` with JavaScript regex engine (no WASM)
- Only bundles 4 language grammars (HTML, CSS, JavaScript, TypeScript) + 2 themes instead of 300+ bundled languages
- Eliminates ~300 chunk files from chrome extension build, significantly reducing build time and output size
- Removed `@streamdown/code` dependency from `packages/ui`, `web`, and `chrome-extension`
- Added `shiki` as direct dependency to both apps for the custom highlighter
- Updated 2 web files (`ChatMessage.tsx`, `PlanContextPanel.tsx`) to import `code` from `@conductor/ui`

## WebSocket terminal — eliminate polling latency - 2026-02-07

- Browser now connects directly to Daytona's PTY WebSocket instead of HTTP polling (~250ms/keystroke → ~1-5ms)
- Added `getPtyWebSocketUrl()` helper in `sandbox.ts` that resolves the Daytona toolbox URL + preview token into a signed WebSocket URL
- Rewrote terminal route: `GET` returns signed WebSocket URL, `POST` only handles resize/disconnect (removed all server-side I/O proxying)
- Rewrote `TerminalPanel.tsx` to use native `WebSocket` with Daytona's control message protocol, auto-reconnection (3 attempts), and direct `ws.send()` for input
- Removed `activePtyHandles` in-memory Map and all server-side PTY buffering code — no more serverless cold-start issues

## Add Daytona volume for Claude Code session persistence across sandboxes - 2026-02-07

- Mount `eva-volume` at `/home/eva/.claude` on every sandbox so Claude Code session `.jsonl` files persist across sandbox lifecycles
- Added cached volume lookup (`getSessionVolume()`) to avoid repeated API calls
- Added `sessionId` and `resumeSessionId` options to `runClaudeCLI()` and `runClaudeCLIStreaming()` for `--session-id` and `--resume` CLI flags
- Added `claudeSessionId` field to `sessions` schema and `updateSandbox` mutation
- Wired session resume into `session-execute.ts`: first message generates a UUID (`--session-id`), subsequent messages resume it (`--resume`) — shared across ask/plan/execute modes
- Fixed terminal PTY route using wrong home directory (`/home/daytona/workspace` → `/workspace/repo`)

## Refactor terminal PTY route — remove duplication, add serverless resilience and resize support - 2026-02-07

- Removed duplicate `Daytona` instance from terminal route, now imports `getSandbox` and `WORKSPACE_DIR` from shared `sandbox.ts`
- Added `connectPty` reconnection fallback so `input`/`poll` actions recover on serverless cold starts instead of failing
- Added `resize` action using Daytona SDK's `resizePtySession()` to send SIGWINCH on terminal resize
- Updated `TerminalPanel.tsx` to POST new cols/rows to backend after `FitAddon.fit()`
- Added `TERM: "xterm-256color"` env to PTY creation for proper terminal rendering
- Removed unnecessary 50ms/100ms sleep delays after input and connection

## Extract shared `@conductor/ui` workspace package - 2026-02-07

- Created `packages/ui/` as a source-only pnpm workspace package (`@conductor/ui`) — no build step needed
- Moved 23 shared UI components (accordion, avatar, badge, button, button-group, card, checkbox, collapsible, command, dialog, dropdown-menu, hover-card, input, input-group, label, popover, progress, select, separator, spinner, tabs, textarea, tooltip) into the shared package
- Moved 5 ai-elements components (conversation, message, prompt-input, reasoning, shimmer) into the shared package
- Moved shared `cn` utility (clsx + tailwind-merge) into the shared package
- Updated ~67 files in `web/` and ~20 files in `chrome-extension/` to import from `@conductor/ui`
- Deleted all duplicate component files from both codebases
- Added `pnpm-workspace.yaml` to enable monorepo workspace linking
- Updated Tailwind configs in both apps to scan shared package for classes

## Port AI Elements SDK to Chrome extension - 2026-02-06

- Ported AI Elements components (conversation, message, prompt-input, reasoning, shimmer) from web app to `chrome-extension/src/components/ai-elements/`
- Refactored `ChatPanel.tsx` to use `Conversation` for auto-scroll, `Message`/`MessageResponse` for message rendering, `Reasoning` for collapsible activity logs and loading state, and `PromptInput` for the input area
- Replaced custom bouncing dots loading indicator with `Reasoning isStreaming` component
- Replaced raw textarea + manual key handling with `PromptInput` compound component
- Replaced custom scroll management with `Conversation`/`ConversationScrollButton`
- Added 7 new shadcn UI primitives: input-group, spinner, button-group, hover-card, command, dropdown-menu, separator
- Replaced custom options-array `Select` with shadcn compound component pattern and updated `RepoSelector.tsx`
- Added `icon-sm` button size variant and `textarea.tsx` primitive
- Installed dependencies: use-stick-to-bottom, streamdown + plugins, motion, nanoid, lucide-react, Radix primitives, cmdk

## Design cleanup: ChatGPT-style minimalism - 2026-02-06

- Flattened all CSS shadow variables to `none` across light and dark modes for a flat, clean aesthetic
- Lightened global border and input colors for subtler visual separation
- Removed shadows from button, card, input, textarea, input-group, select, tabs, and badge components
- Softened hover states on buttons and ghost elements (half-opacity accent backgrounds)
- Simplified badges: tinted backgrounds instead of solid fills, removed borders from base class
- Lightened dialog overlay from 80% to 50% opacity, removed dialog border
- Removed default `border-b` from accordion items
- Flattened sidebar navigation: removed grouped headers (BUILD/FIX/TEST/DATA), chevrons, and expand/collapse logic in favor of a simple flat list
- Removed sidebar bottom border separator and logo pill background
- Removed border separators from chat header, summary accordion, and input area in ChatPanel and QueryDetailClient
- Updated message bubbles: user messages use subtle `bg-secondary` instead of `bg-primary`, assistant messages have no background
- Removed border separators from DocViewer, ProjectDetailClient, testing-arena pages, and SessionFunnel

## Add response length selector to chat UIs - 2026-02-06

- Created `ResponseLengthSelector` component with concise/default/detailed options
- Added response length selector to sessions `ChatPanel.tsx` and research queries `QueryDetailClient.tsx` toolbars
- Wired response length through Inngest event data to `session-execute.ts` (ask/plan/execute modes) and `execute-research-query.ts`
- Injected response length instructions into Claude CLI prompt strings

## Refactor Sessions + Queries chat UI with AI Elements SDK - 2026-02-06

- Installed AI Elements SDK components (message, conversation, prompt-input, reasoning) as source code in `web/lib/components/ai-elements/`
- Refactored `ChatPanel.tsx` (sessions) to use `Conversation` for auto-scroll, `Message`/`MessageContent`/`MessageResponse` for message rendering, `Reasoning` for collapsible activity logs, and `PromptInput` for the input area
- Refactored `QueryDetailClient.tsx` (research queries) with the same AI Elements components
- Replaced manual scroll management (`useRef` + `useEffect`) with `Conversation`/`ConversationScrollButton`
- Replaced raw `Streamdown` markdown rendering with `MessageResponse` (includes GFM, math, code highlighting, CJK, mermaid)
- Replaced custom `Accordion`-based activity logs with `Reasoning` component (auto-open during streaming, auto-close after)
- Replaced custom `Textarea`/form with `PromptInput` compound component (auto-resize, Enter to submit, form reset)
- Added new shadcn/ui primitives: collapsible, hover-card, button-group, command, input-group
- Adapted all AI Elements components for Tailwind v3 compatibility (replaced v4-only `field-sizing-content`, `shadow-xs`, `--color-*` CSS vars)
- Added `icon-sm` button size variant and restored `Spinner` size prop for backwards compatibility
- Added streamdown dist to Tailwind content config for proper style scanning

## Port purple theme to chrome-extension - 2026-02-06

- Updated chrome-extension CSS variables from HSL teal to RGB purple theme matching the web app
- Switched tailwind.config.js color references from `hsl(var(--...))` to `var(--...)` format
- Replaced all hardcoded `teal-*` Tailwind classes across 5 sidepanel files with `primary` theme equivalents
- Replaced all `#14b8a6` teal hex colors in 3 content script overlay files with `#975799` purple using Tailwind arbitrary values and inline styles (shadow DOM compatible)
- Updated dialog and tabs UI components to use `rounded-md` for consistency with web

## Replace hardcoded teal colors with primary theme variables - 2026-02-06

- Replaced all hardcoded `teal-*` Tailwind color classes across 29 files with `primary` theme equivalents (`text-primary`, `bg-primary/10`, `border-primary`, etc.)
- Collapsed redundant `dark:` variant classes since `primary` CSS variables already adapt to dark mode
- Updated gradient backgrounds (sidebar logo, welcome banner, repo home) to use `bg-primary/10` and `bg-gradient-to-br from-primary/80 to-primary/90`
- Replaced teal spinner borders, selection rings, chat bubbles, and status indicators with primary color
- Updated `UserInitials` to use `bg-primary text-primary-foreground`
- Updated `ProjectPhaseBadge` finalized phase to use `bg-primary/15` and `text-primary`

## Replace HeroUI with shadcn/ui - 2026-02-06

- Migrated all 57 files from HeroUI components to shadcn/ui equivalents
- Created 15 shadcn UI components (button, dialog, input, textarea, card, tabs, accordion, tooltip, popover, dropdown-menu, select, checkbox, avatar, badge, progress, separator, label, spinner)
- Added CSS variable theming in globals.css preserving teal primary color scheme
- Updated tailwind.config.js to remove HeroUI plugin and add shadcn color config
- Replaced HeroUIProvider with TooltipProvider in ClientProvider.tsx
- Created useDisclosure hook replacement at lib/hooks/use-disclosure.ts
- Replaced all HeroUI-specific Tailwind classes (text-default-_, bg-default-_, border-divider) with shadcn equivalents
- Added components.json for shadcn CLI configuration
- Installed Radix UI primitives and class-variance-authority dependencies

## Before/After Web App Screenshots for Task Execution - 2026-02-05

- Added Playwright-based before/after screenshots to the task execution flow (`execute-task.ts`)
- Before Claude runs: installs Playwright, starts dev server, screenshots `localhost:3000`
- After Claude runs: screenshots again (hot reload applies changes), uploads both to Convex via `taskProof`
- Added 3 sandbox helpers: `detectPackageManager`, `installPlaywright`, `takeWebScreenshot`
- All screenshot steps are non-blocking — failures are caught and task execution continues normally

## Streaming Hot/Cold Path Separation - 2026-02-05

- Moved live streaming state to a separate `sessionStreaming` table (~100 bytes) so the heavy session document isn't rewritten every 500ms
- Session document now only written twice per execution (add empty message + final result) instead of 60-120 times
- `sessions.get` subscribers no longer hammered during streaming — only the lightweight `sessionStreaming` query updates frequently
- Simplified `runClaudeCLIStreaming` to send only the latest activity per interval instead of the full accumulated log
- Removed double-parsing of raw output — now parsed once at the end for both result extraction and activity log

## Unified streamingActivity Table + Projects Streaming Fix - 2026-02-05

- Replaced separate `sessionStreaming` table with a generic `streamingActivity` table using `entityId: string` — works for sessions, projects, and any future entity
- Created `backend/convex/streaming.ts` with shared `get`/`set`/`clear` functions
- Applied hot/cold path separation to project interview flow (`interview-question.ts`) — same pattern as sessions
- Updated `ProjectChatTab` to use `streamingActivity` prop from the new shared streaming query
