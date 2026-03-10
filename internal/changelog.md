# Changelog

## Cleanup audit categories: remove system defaults, add per-app support - 2026-03-09

- **Why**: System-seeded audit categories were inflexible and forced a specific set on users. Moving to fully user-defined categories gives more control. Per-app audit support lets monorepo users configure different audits for different apps.
- **Changes**:
  1. Removed `SYSTEM_DEFAULTS` and `seedDefaults` mutation — no more system-level categories.
  2. Removed `isSystem` enforcement (edit/delete guards). All categories are now user-owned and fully editable/deletable.
  3. Added `appId` field to `auditCategories` — `undefined` = repo-level, set = app-specific category.
  4. Added `disabledForAppIds` field — repo-level categories can be disabled per-app without deleting them.
  5. New `listEnabledForContext(repoId, appId?)` query replaces `listEnabledByRepo` — merges repo-level (minus disabled) + app-specific categories.
  6. New `toggleDisabledForApp` mutation for per-app inheritance overrides.
  7. UI: Two sections on audit settings page — "Repo-level Audits" and "Per-app Audits" (shown when monorepo has child apps). Removed "Get defaults" button and "System" badges.
  8. Migration function `clearIsSystemFromAuditCategories` to clean up `isSystem` field from existing documents.
- **Migration needed**: Run `clearIsSystemFromAuditCategories`, then remove `isSystem` from schema.

## Auto-generate fix PRs from testing arena evaluation failures - 2026-03-06

- **Why**: When the testing arena evaluation found failing requirements, users had to manually create tasks to fix them. Now the system automatically spins up a sandbox, fixes the issues, and creates a PR — closing the feedback loop without leaving the testing arena.
- **Changes**:
  1. Added `fixStatus`, `fixBranchName`, and `prUrl` fields to the `evaluationReports` schema and validators.
  2. Extended `evaluationWorkflow` to continue after evaluation completes with failures: spins up a write-enabled sandbox, gives Claude the failing requirements to fix, creates a branch and PR via `createPullRequest`, stores the PR URL on the report.
  3. Added `fixCompleteEvent`, `handleFixCompletion`, `getFixData`, `setFixing`, `saveFixResult`, `saveFixError` functions to support the fix workflow lifecycle.
  4. Updated the frontend testing arena page to display fix status (fixing indicator, streaming activity during fix), and a "View Fix PR" link button on the report card header.
- **Reason for change (architectural)**: Evaluation and fix are a natural continuation — keeping them in the same workflow simplifies state management and avoids orphaned fix attempts.

## Dynamic audit categories — 2026-03-09

Replaced hardcoded audit toggle fields (`accessibilityAuditEnabled`, `codeTestingAuditEnabled`, `codeReviewAuditEnabled`, `postAuditEnabled`) on `githubRepos` with a dedicated `auditCategories` table. Categories are per-repo, user-manageable, and the prompt builder reads enabled categories dynamically.

- New `auditCategories` table: `repoId`, `name`, `description`, `enabled`, `isSystem`, `createdAt`
- CRUD mutations: `listByRepo`, `listEnabledByRepo`, `seedDefaults`, `create`, `update`, `toggleEnabled`, `remove`
- System defaults (Accessibility, Testing, Code Review) are seeded via "Get defaults" button, marked `isSystem: true`, non-deletable
- Users can add custom audit categories with name + description (sent as AI instructions)
- `buildAuditPrompt` and `buildSessionAuditPrompt` now accept `categories[]` instead of `AuditFlags`
- `getTaskData` returns `auditCategories` instead of 4 boolean flags
- Session audit (`_daytona/audit.ts`) queries enabled categories before running
- New `/settings/audits` page with category list, enable/disable toggles, and add form
- Added "Audits" nav item to `SettingsSidebar`
- Removed old fields from schema, helpers, mutations, and ConfigClient
- Migration: `removeOldAuditFieldsFromRepos` strips old fields via `ctx.db.replace()`

## Unified audits table + flexible sections — 2026-03-09

Merged `taskAudits` and `sessionAudits` into a single `audits` table with `entityId: v.union(v.id("agentTasks"), v.id("sessions"))`. Reduces table sprawl — audit data is identical regardless of context, only the foreign key differs.

Also replaced hardcoded 3-field audit schema (`accessibility`, `testing`, `codeReview`) with flexible `sections: Array<{ name, results }>` format. New audit categories can be added without schema/frontend changes.

- New `audits` table with polymorphic `entityId` and `by_entity` index
- `auditSectionValidator` for dynamic sections
- Shared audit JSON parser in `_taskWorkflow/auditParser.ts` (eliminates duplication, no `as` casts)
- Frontend dynamically maps `sections` array
- Prompt builders output `sections` format
- `/audit` skill system: router + `/audit-accessibility`, `/audit-code-review`, `/audit-testing`
- Migration: `migrations/mergeAuditTables.ts` moves data from old tables to unified table

## Proof of completion carousel — 2026-03-08

Added an Embla-based carousel (shadcn pattern) to the task detail proof section. When a task has multiple screenshots/videos, they are now shown in a swipeable carousel with prev/next buttons and dot indicators, instead of a vertical stack. Single media items render normally without carousel chrome.

- New `Carousel` component in `packages/ui` (Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots)
- Updated `useTaskDetail.tsx` proof section to separate media vs message proofs and wrap media in the carousel

## Move active tasks indicator from sidebar bottom to Quick Tasks tab badge — 2026-03-08

- **Why**: The active tasks component at the bottom of the sidebar was disconnected from where tasks live. Moving it inline as a badge on the Quick Tasks nav item provides better context and discoverability.
- **Changes**: Replaced the standalone `ActiveTasksPopover` at sidebar bottom with an `ActiveTasksBadge` that renders inline on the Quick Tasks nav item — shows a glowing green dot + "{count} live" text, with the same hover popover for task details.

## Fix git checkout failures due to dirty working tree — 2026-03-08

- **Why**: `git checkout` was aborting when auto-generated files (e.g. `next-env.d.ts`) existed as local changes in the sandbox, causing tasks and sessions to fail during branch setup.
- **Changes**: Added `git stash --include-untracked` before checkout in `checkoutSessionBranch` and `prepareSandbox` base-branch checkout. The `setupBranch` function already had this — now all checkout paths are consistent.
- **Reason**: Sandboxes that are reused across runs can accumulate untracked/modified files from previous executions. Stashing ensures branch switches always succeed.

## Fix Build Project button disabled state & branch sync — 2026-03-08

- **Why**: Build Project button stayed clickable after starting a build, and project branches fell behind their base branch (e.g. 80 commits behind main).
- **Changes**:
  - Build Project button now also disables when `activeBuildWorkflowId` is set (active build running), not just when a build is scheduled. Dialog button disables during mutation.
  - `setupBranch` in git.ts now fast-forwards from `origin/{branch}` and merges `origin/{baseBranch}` after checkout. This ensures project branches incorporate latest base branch commits before each task execution — matching how quick tasks always branch from the latest base.
- **Reason**: Button disabled condition was incomplete — only checked `scheduledBuildAt`, missing `activeBuildWorkflowId`. Branch sync only did `git fetch` + `git checkout` without merging base, so existing project branches never picked up new base commits.

## Eva config: richer ask-mode responses + LSP tool enabled — 2026-03-08

### Summary

Two improvements to Eva's session configuration:

1. **Ask mode now supports rich markdown and mermaid diagrams** — previously ask mode was restricted to plain text. Non-technical users benefit more from visual diagrams (flow charts, architecture diagrams) than prose, so the system prompt now encourages mermaid blocks for architecture/data flow explanations while keeping language jargon-free.

2. **`ENABLE_LSP_TOOL=true` added to all sandbox launches** — Claude Code defaults to text-grep for code navigation. Setting this flag connects it to language servers (LSP), enabling "jump to definition"-style lookups that are significantly faster and more accurate for finding functions and symbols across the codebase.

## Per-context sandbox lifecycle management — 2026-03-08

Behavior per context:

┌──────────────────┬───────────┬─────────────────────┬───────────┐
│ Context │ autoStop │ autoDelete │ ephemeral │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Quick tasks │ 0 (never) │ 0 (instant on stop) │ true │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Snapshot warming │ 0 (never) │ 0 (instant on stop) │ true │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Sessions │ 30 min │ 30 min │ false │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Design sessions │ 30 min │ 30 min │ false │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Project tasks │ 30 min │ 30 min │ false │
└──────────────────┴───────────┴─────────────────────┴───────────┘

- **Why**: Tasks running >15 minutes were killed by the watchdog ("no heartbeat for 180s"). Root cause: a single `autoStopInterval: 15` on all sandbox creation meant Daytona auto-stopped sandboxes after 15 min of no SDK API calls. Background scripts (`nohup`) don't count as activity per Daytona docs, so sandboxes appeared idle immediately after launch.
- **Changes**: Introduced `SandboxLifecycle` type with two presets — `EPHEMERAL_LIFECYCLE` (autoStop=0, ephemeral=true for tasks/warming) and `SESSION_LIFECYCLE` (autoStop=30, autoDelete=30 for sessions/projects/design). Threaded lifecycle config through `createSandbox` → `createSandboxAndPrepareRepo` → `getOrCreateSandbox`. Also consolidated retry logic (90s per-call timeout on `daytona.create()`, 3 attempts/12min budget).
- **Reason**: Different sandbox contexts have conflicting needs. Ephemeral tasks need no auto-stop (background script, cleaned up by our code). Sessions benefit from 30-min auto-stop since preview URL access resets the timer. Using Daytona's `ephemeral: true` flag auto-deletes ephemeral sandboxes on stop as a safety net.

## Quick Tasks UI revamp (follow-up polish) — 2026-03-08

- **Why**: Reviewer feedback on the tab-based task detail UI needed addressing.
- **Changes**:
  - Removed section titles inside each tab (Activity, Proof of Completion, etc.) — redundant with tab labels
  - Added icons to tab triggers (Terminal, Photo, Shield, Message) reusing existing tabler icons
  - Modal hides tabs column for "todo" status tasks unless content exists in any tab
  - Comments textarea no longer sends on Enter — only the send button submits
  - Reverted task card list width back to original 20%/30% split
- **Reason**: Polish pass based on reviewer feedback to reduce redundancy and fix UX issues.

## Quick Tasks UI revamp — 2026-03-08

- **Why**: Task detail views stacked all content vertically (activity, proof, audit) making it hard to find specific sections. Request changes opened a 4th column in the modal which was awkward. Task cards showed redundant description text.
- **Changes**:
  - Removed description from task list cards (QuickTaskCard) — title is sufficient for scanning
  - Added 4-tab system (Activity, Proof, Audit, Comments) to both inline and modal detail views — Activity is default tab
  - In the modal, tabs appear in the 2nd column; in the inline view, tabs appear under the description/subtasks
  - Request Changes button now switches to Comments tab instead of opening a separate panel/column
  - Comments tab shows existing comments with delete option and a form that auto-runs Eva on submit when changes are requestable
  - Bumped task card list width from 20%/30% to 28%/35% for better readability
- **Reason**: Consolidating content into tabs reduces visual clutter and makes it easier to navigate between sections. Moving request changes into comments is more natural UX.

## Extract shared ScheduleDateTimePicker component — 2026-03-08

- **Why**: The schedule time input crashed with `TypeError: .second is not a function` when typing partial time values (e.g. "0"). The `SchedulePopover` had a fix for this (validating `parts.length` and `NaN`), but `ScheduleTasksModal` and `ScheduleBuildPopover` didn't, causing the error in the quick-tasks bulk schedule flow.
- **Changes**:
  - Created `ScheduleDateTimePicker` component with `useScheduleDateTime` hook and `ScheduleDateTimeActions` — shared calendar + time input with proper input validation
  - Refactored `SchedulePopover`, `ScheduleBuildPopover`, and `ScheduleTasksModal` to use the shared component
- **Reason**: Three components duplicated the same date-time picking logic. Extracting it ensures the validation fix is applied everywhere and prevents future drift.

## Convex rules audit: index naming & filter cleanup — 2026-03-08

- **Why**: Convex rules require index names to include all field names (with "and" for multi-field), and `.filter()` on queries should be replaced with `.withIndex()` for indexed lookups.
- **Changes**:
  - Renamed `by_owner_name` → `by_owner_and_name` on `githubRepos` (multi-field index missing "and")
  - Renamed `by_repoId` → `by_repo` on `repoSnapshots` (consistency with codebase convention)
  - Renamed `by_repoSnapshotId` → `by_repo_snapshot` on `snapshotBuilds` (consistency)
  - Added composite index `by_repo_snapshot_and_status` on `snapshotBuilds` — eliminates `.filter()` in `getRepoSnapshotName`
  - Added composite index `by_task_and_depends_on` on `taskDependencies` — eliminates `.filter()` in `add` and `removeByTasks`
  - Added composite index `by_team_and_role` on `teamMembers` — eliminates `.filter()` in `remove` (last-owner check)
  - Updated all 10 call sites referencing renamed indexes
- **Reason**: Enforcing Convex best practices — indexed queries over `.filter()` for performance, consistent naming conventions.

## Database bandwidth optimization — 2026-03-08

- **Why**: Top Convex functions by bandwidth were consuming excessive reads due to full table scans, missing indexes, JS filtering after collect, and heavy documents returned to clients unnecessarily.
- **Changes**:
  - Added `by_repo_and_status` and `by_repo_and_updatedAt` indexes to `agentTasks` — eliminates full table scans in `getActiveTasks` and JS status filtering in `getAllTasks`
  - `getActiveTasks` now queries per-repo per-status via compound index instead of scanning entire `agentTasks` table
  - `getAllTasks` queries 6 non-draft statuses individually via compound index instead of collecting all and filtering
  - `analytics.getImpactStats` uses `by_repo_and_updatedAt` range query for time-filtered tasks instead of JS filtering after full collect
  - Removed `projects.get` subscription from `ProjectCard` — each card was fetching the full project doc (including heavy `conversationHistory`) just for participant avatars. Now uses `members`/`projectLead` from the lightweight list data
  - Moved `conversationHistory` and `generatedSpec` from `projects` table to new `projectDetails` table — `projects.list` no longer reads these heavy fields from the DB. `projects.get` joins them back for detail views.
- **Reason**: Convex rule "Do NOT use filter in queries — use withIndex instead" was violated in multiple high-traffic functions. The `projects` table carried unbounded conversation data that was read on every list query even though it was stripped before returning.

## Mobile responsiveness audit (deep pass) — 2026-03-07

- **Why**: Many pages and components had fixed widths, missing responsive breakpoints, and overflow issues that made the platform difficult to use on phones and tablets.
- **Changes**:
  - Quick Tasks: Split view now uses sm breakpoint instead of md for earlier stacking, filter button max-width tightened, card padding reduced on mobile, kanban columns use 75vw snap width
  - Sessions: Added useMediaQuery hook; mobile devices now get vertical stack layout instead of resizable horizontal panels; summary accordion and plan content padding responsive; prompt input area tighter on mobile
  - Designs: Chat panel gets max-h-50vh on mobile to share space with preview, min-width reduced for medium screens, preview panel header wraps on small screens, footer gap/padding responsive, persona dialogs width-capped to viewport
  - Testing Arena: Test run list max-height tuned for mobile, test detail padding responsive (px-4 → sm:px-10), header padding tighter, branch select narrower on small screens
  - Settings: Config card padding responsive, snapshots table min-width reduced on mobile (360px), table cell padding tighter (px-2 → sm:px-4), logs summary grid gap responsive
  - Shared: Main sidebar width capped to prevent overflow on very small screens (min of 16rem, 100vw-3rem), mobile header padding responsive, SidebarLayoutWrapper mobile drawer capped to 100vw-2rem, ChatPageWrapper header gap and wrap improved, KanbanBoard columns use 75vw for better mobile snapping, TaskDetailInline gap responsive, TaskDetailModal gets w-full for mobile constraint
  - Added `useMediaQuery` hook for responsive layout switching
- **Reason for change**: Mobile-first accessibility audit across quick tasks, sessions, designs, documents, testing arena, inbox, stats, and settings pages.

## Replace JWT auth with HMAC for sandbox streaming heartbeats — 2026-03-07

- **Why**: All task runs were being killed by the watchdog ("no heartbeat for 180s"). Root cause: the callback script's `streaming:set` calls used `authMutation` which requires JWT validation + user DB lookup on every call. Convex's auth layer intermittently fails (confirmed by `presence:disconnect` throwing "Not authenticated" every ~10s). Since heartbeat errors were silently swallowed, heartbeats died for 180s and the watchdog killed the run.
- **Changes**:
  1. Added `POST /api/streaming/heartbeat` HTTP endpoint in `http.ts` that validates via HMAC instead of JWT.
  2. HMAC is computed server-side (`signAndLaunchScript`) as `HMAC-SHA256(ENCRYPTION_KEY, entityId)` — scoped to one streaming entity, unforgeable without the secret.
  3. Callback script now calls the HMAC endpoint for all streaming writes (heartbeats, flush, finalization).
  4. Falls back to old `streaming:set` authMutation if HMAC env vars aren't set.
  5. Added retry + error logging to heartbeat/flush paths.
  6. Fixed missing `customTheme` field in `getUserByClerkId` return validator.
- **Reason for change**: JWT auth is inherently fragile for high-frequency calls from sandboxes. HMAC eliminates the entire auth chain (JWT parsing, signature verification, user DB lookup) from the heartbeat path.

## Add Ctrl+Enter hotkey to Quick Task modal — 2026-03-07

- **Why**: Creating a quick task required clicking the button. Power users expect keyboard shortcuts for common actions.
- **Changes**: Added `@tanstack/react-hotkeys` and wired `Mod+Enter` (Ctrl+Enter / Cmd+Enter) to submit the quick task form. Added a `⌘↵` hint on the Create Task button.

## Split post-execution audit into 3 individual toggles — 2026-03-07

- **Why**: The single `postAuditEnabled` toggle was all-or-nothing. Users couldn't disable expensive/irrelevant audit sections (e.g. accessibility for backend-only repos) and there was no extensibility path for adding more audit types.
- **Changes**:
  1. Added `accessibilityAuditEnabled`, `codeTestingAuditEnabled`, `codeReviewAuditEnabled` fields to `githubRepos` schema (all default to true via `!== false`).
  2. Updated `updateConfig` mutation, `getTaskData` query, and workflow definition to pass individual flags.
  3. `buildAuditPrompt` now dynamically builds the prompt based on which audits are enabled.
  4. UI replaced single checkbox with 3 granular checkboxes under a "Post-execution Audits" heading.
  5. Task detail audit display filters out empty sections (disabled audits won't render).
- **Reason for change**: Granular control over audit types, extensibility for future audit additions.

## Hide/show repositories and monorepo apps — 2026-03-07

- **Why**: Some monorepo apps (e.g. MCP, Chrome extension) and codebases clutter the repo selector and home page but shouldn't be deleted. Users need a way to hide them from the UI without removing them from Eva.
- **Changes**:
  1. Added `hidden` optional boolean field to `githubRepos` schema and validator.
  2. `list` query now accepts optional `includeHidden` arg — defaults to filtering out hidden repos. Management pages (monorepo settings, team detail) pass `includeHidden: true`.
  3. Added `toggleHidden` mutation for setting visibility.
  4. RepoCard dropdown now has a "Hide" option.
  5. New `HiddenReposSheet` dialog on the home page header shows count of hidden repos and lets users unhide them.
  6. Hidden repos are automatically filtered from the sidebar RepoSelect.
  7. Monorepo settings page (`/settings/monorepo`) now shows a "Connected Apps" section with per-app visibility toggles (Visible/Hidden) so users can manage which monorepo apps appear in the sidebar and home page from one place.

## Change session collapse to hide sandbox panel instead of chat — 2026-03-07

- **Why**: The collapse button previously collapsed the chat panel (left side), which was counterintuitive — users want to expand the chat to focus on conversation, not hide it. Collapsing the sandbox panel (right side) makes more sense as users may want a full-width chat view.
- **Changes**: Made the sandbox (right) panel collapsible instead of the chat panel. Moved the collapse/expand button from the SandboxPanel tab switcher header to the ChatPanel header actions area. Uses right-sidebar collapse/expand icons to match the panel direction.

## Dismiss Daytona preview warning for all iframes — 2026-03-07

- **Why**: Every iframe (web preview, VS Code, VNC desktop, design preview) showed a Daytona security warning page on first load, requiring manual dismissal.
- **Changes**: Created `dismissDaytonaWarning` utility that sends a `HEAD` request with `X-Daytona-Skip-Preview-Warning: true` header before loading each iframe. Applied to all 4 preview surfaces: SandboxPanel (web), EditorPanel (VS Code), DesktopPanel (VNC), and DesignDetailClient (design). Uses an in-memory Set to avoid redundant requests per origin.

## Fix: new sessions no longer auto-appear as sandbox running — 2026-03-07

- **Why**: Creating a new session or design session set `status: "active"`, which the frontend interpreted as "sandbox is running". This caused the UI to show sandbox-active state (spinners, no "Start" button) even though no sandbox had been started.
- **Changes**: Changed initial status from `"active"` to `"closed"` in both `_sessions/mutations.ts` (sessions) and `designSessions.ts` (design sessions) create mutations. Status only becomes `"active"` when `sandboxReady` is called after a real sandbox starts.

## Instant sandbox start feedback + unified design/session button — 2026-03-07

- **Why**: Clicking "Start" on a session or design sandbox gave no feedback for ~30 seconds until the sandbox was fully ready. The design page also used a different button pattern from sessions.
- **Changes**:
  1. Added `"starting"` to `sessionStatusValidator` — used by both `sessions` and `designSessions` tables.
  2. `startSandbox` mutations (sessions + design) now set `status: "starting"` immediately before scheduling the background action, so the UI reflects the state change instantly.
  3. Session UI derives `isSandboxStarting` from `session.status === "starting"` instead of local `useState` — the spinner is now driven by the database, surviving page refreshes.
  4. Design page button replaced with the same icon-button pattern as sessions (play/stop icon, destructive variant when active, spinner when toggling).
- **Reason for change**: Immediate visual feedback on start. Consistent button UX across sessions and design pages.

## Show all tasks on Quick Tasks page with project filter — 2026-03-07

- **Why**: Quick Tasks page only showed orphan tasks (no project). Tasks assigned to projects were hidden, making it impossible to see all tasks in one place or filter by project.
- **Changes**:
  1. Removed `!t.projectId` filter from QuickTasksClient, QuickTasksListView, and QuickTasksKanbanBoard — all tasks now show by default.
  2. Added `projectFilterParser` nuqs param with values: "all" (default), "none" (orphan tasks only), or a specific project ID.
  3. Added project filter dropdown to QuickTasksToolbar showing all repo projects.
  4. Added `projectName` badge on QuickTaskCard for tasks belonging to a project.
  5. Centralized task filtering in QuickTasksClient — child views now receive pre-filtered tasks as props instead of re-querying.
- **Reason for change**: Visibility. Users need to see all tasks regardless of project membership, with the ability to filter by project.

## Add granular streaming progress during sandbox setup — 2026-03-07

## Streaming progress: setup steps + callback script continuity — 2026-03-07

- **Why**: Three problems: (1) Users saw "Starting sandbox..." for up to 5 minutes with no feedback during `prepareSandbox`. (2) The progress format was `{steps:[{label}]}` which `parseActivitySteps` didn't recognize, so it rendered as raw JSON. (3) When the callback script started, it overwrote all setup progress with a fresh `["Starting Claude..."]`, losing the history.
- **Changes**:
  1. **Setup progress** — Added `streamingEntityId` arg to `prepareSandbox`. Emits progress via `internalSet` mutation at each milestone: "Creating sandbox...", "Cloning repository...", "Installing dependencies...", "Syncing repository...", "Resuming sandbox...", "Fetching base branch...", "Setting up branch...", "Starting desktop...", "Retrying sandbox setup...".
  2. **Correct format** — `emitProgress` now emits the `ActivityStep[]` format (`[{type, label, status}]`) that the frontend parser expects, with accumulated completed steps + one active step. On retry, the step history resets.
  3. **Continuity with callback script** — `launchOnExistingSandbox` reads the current streaming activity via `internalGet` query and passes it as `PRIOR_STEPS` env var. The callback script reads `PRIOR_STEPS` on startup and initializes `accumulatedSteps` from it, so setup steps appear as completed before "Starting Claude..." begins.
  4. **Supporting infrastructure** — Added `internalGet` query and `internalSet` mutation to `streaming.ts`. Updated all 12 workflow callers across 10 files to pass `streamingEntityId`.
  5. **`onProgress` callbacks** — Added to `cloneAndSetupRepo`, `createSandboxAndPrepareRepo`, and `getOrCreateSandbox` in `git.ts`.
- **Reason for change**: Users now see one continuous chain of steps from sandbox creation through Claude execution, all rendered by the same `ActivitySteps` component.

## Split (main) into (global) + (repo) route groups — 2026-03-07

- **Why**: All pages (global home/teams/inbox/theme and repo-scoped pages) lived under a single `(main)` route group with a conditional `showTopNavBar` hack in the layout. This caused: inbox broke sidebar when clicked (navigated away from repo context), theme link in SettingsSidebar was dead (no page existed at repo-relative path), and no clear boundary between global and repo-scoped routes.
- **Changes**:
  1. Renamed `app/(main)/` to `app/(repo)/` — keeps repo layout (Sidebar + RepoProvider).
  2. Created `app/(global)/` with a new layout — TopNavBar + max-w-7xl container, no conditional logic.
  3. Moved global pages (`home/`, `teams/`, `setup/`, `settings/theme/`, `inbox/`) to `(global)/`.
  4. Extracted `InboxClient` and `ThemeSettingsClient` + `_components/` to `lib/components/` so both route groups can import them.
  5. Created thin repo-scoped pages at `(repo)/[owner]/[repo]/inbox/` and `(repo)/[owner]/[repo]/settings/theme/` that render the shared client components inside the repo layout with sidebar visible.
  6. Updated Sidebar inbox href from `/inbox` to `${repoBasePath}/inbox` so it stays in repo context.
  7. Added Inbox + Theme tabs to TopNavBar alongside Repositories and Teams.
- **Reason for change**: Architectural. Clean separation between global pages (TopNavBar, no sidebar) and repo pages (Sidebar, RepoProvider) eliminates the conditional layout hack and fixes broken navigation paths.

## Split setupAndExecute into prepareSandbox + launchOnExistingSandbox — 2026-03-07

- **Why**: The `setupAndExecute` Convex action bundled sandbox creation (with up to 5 internal retries), repo cloning, branch setup, AND script launch into a single action. For repos without snapshots, this could exceed Convex's 10-minute action timeout — especially when retries compounded cold clone + npm install times.
- **Changes**:
  1. Split `setupAndExecute` into `prepareSandbox` (sandbox creation + repo setup) and reuse `launchOnExistingSandbox` (script upload + launch). Each gets its own 10-minute budget as separate workflow steps.
  2. Reduced `maxSetupAttempts` from 5 to 2 and added a 7-minute elapsed time guard to prevent retry loops from exceeding action limits.
  3. Updated all 12 workflow callers across 10 files to use the two-step pattern.
  4. Converted callback script from template-interpolated function to static constant — `completionMutation` and `entityIdField` are now passed as environment variables instead of string interpolation.
- **Reason for change**: Architectural. A single action doing too much work risked Convex function timeouts. Splitting into workflow steps gives each operation its own timeout budget and makes failures more granular.

## Decompose monolithic client components into \_components/ + \_utils convention - 2026-03-07

- **Why**: 10 route-level `*Client.tsx` files (300-568 lines each) mixed data fetching, state management, handlers, helper functions, and all JSX in a single file. This made them hard to read, maintain, and modify without risk of side effects.
- **Changes**:
  1. Established `_components/` + `_utils.ts` convention per route for co-located decomposition.
  2. Refactored 10 files: RepoHomeClient (317→154), ThemeSettingsClient (349→95), LogsClient (383→150), RepoSetupClient (326→195), ReposClient (495→141), TeamDetailClient (422→79), ProjectsClient (435→250), QueryDetailClient (522→48), DesignDetailClient (500→137), QuickTasksClient (568→259).
  3. Created ~30 extracted components across `_components/` folders and 3 `_utils.ts` files.
  4. Added "Component Structure" rules to CLAUDE.md (~250 line max, orchestrator pattern, \_components/ convention).
- **Reason for change**: Architectural. Monolithic client components violate single-responsibility and make it hard to reason about changes. The orchestrator + child component pattern keeps data flow clear and components maintainable.

## Decompose DesignDetailClient into smaller components - 2026-03-07

- **Why**: `DesignDetailClient.tsx` was 500 lines handling chat, preview, sandbox control, and tab state all in one component. This made it hard to reason about responsibilities and would only grow worse as features are added.
- **Changes**:
  1. Extracted `DesignChatPanel` — owns conversation rendering, message sending/cancelling, persona selection, and streaming display.
  2. Extracted `DesignPreviewPanel` — owns iframe preview, variation tabs, desktop/mobile toggle (nuqs state), and variation selection UI.
  3. Slimmed `DesignDetailClient` to an orchestrator: session query, sandbox lifecycle, preview URL fetching, and composing the two panels.
- **Reason for change**: Single-responsibility decomposition. Each component now has a clear concern boundary, making future changes (e.g., swapping preview tech, adding chat features) isolated.

## Backend simplification round 2: dead code removal and dedup - 2026-03-07

- **Why**: Audit of 80+ Convex files found dead code paths, unused exports, and repeated patterns that added maintenance burden without providing value.
- **Changes**:
  1. Deleted dead PR creation chain in `testGenWorkflow.ts` — `createPr` → `createPrAction` was a no-op chain (empty handler). Removed scheduler call in `saveResult` too. (~45 lines)
  2. Deleted 4 unused CRUD mutations from `evaluationReports.ts` (`updateEvalStatus`, `completeEval`, `failEval`, `updateEvalSummary`) — workflow handles all status transitions directly via `ctx.db.patch()`. (~79 lines)
  3. Extracted `timeoutLastMessage` helper in `workflowWatchdog.ts` to deduplicate the "find last assistant message → patch content" pattern across 3 handlers. (~20 lines saved)
  4. Extracted `updateLastHistoryEntry` in `docInterviewWorkflow.ts` and `updateLastConversationEntry` in `projectInterviewWorkflow.ts` to deduplicate the "clone history → update last entry → return" pattern (5 instances each). (~30 lines saved)
- **Reason for change**: Dead code creates confusion about what's active. Duplicated patterns mean bugs fixed in one spot get missed in others.

## Simplify chat panel, design page, analyse page - 2026-03-07

- **Why**: ChatPanel, DesignDetailClient, and QueryDetailClient had significant code duplication — `ensureHttps()` copied in 2 files, session cache helpers copied in 2 files, IIFE+parseActivitySteps rendering pattern copy-pasted 6 times across 3 files, `evaIcon` JSX duplicated, user avatar block duplicated in 3 files. Also had `as` type assertions and a `!` non-null assertion violating project rules.
- **Changes**:
  1. Extracted `ensureHttps` to `lib/utils/ensureHttps.ts`, `createSessionCache` factory to `lib/utils/sessionCache.ts`
  2. Created `EvaIcon`, `UserMessageAvatar`, `StreamingActivityDisplay`, and `ActivityLogDisplay` shared components
  3. Fixed `as Id<>` cast in QueryDetailClient by typing page params correctly
  4. Fixed `as "execute" | "ask" | "plan"` cast in ChatPanel with type guard
  5. Fixed `sandboxId!` non-null assertion in DesktopPanel
  6. Added `useMemo` for `filteredMessages`, `latestVariations`, and `personaMap` to avoid unnecessary recomputation
  7. Replaced O(n\*m) persona `.find()` lookup with O(1) Map lookup in DesignDetailClient
- **Reason for change**: Code duplication across chat-like pages made changes error-prone and increased maintenance burden. Type safety violations needed fixing.

## Settings pages code structure cleanup - 2026-03-07

- **Why**: Settings pages had duplicated `formatDuration` implementations (SnapshotsClient and LogsClient), `as` type assertion violations in ThemeSettingsClient and ThemeContext, and repeated button styling across 4 theme sections.
- **Changes**:
  1. Added `formatDurationMs` and `formatDurationMsShort` to shared `lib/utils/formatDuration.ts`. Removed local copies from SnapshotsClient and LogsClient.
  2. Added `resolveCustomTheme` helper to ThemeContext to eliminate 4 `as` casts in ThemeSettingsClient. Fixed `as HTMLStyleElement` cast in ThemeContext with `instanceof` check.
  3. Extracted `OptionButton` component in ThemeSettingsClient to deduplicate active/inactive button styling across Accent Color, Border Radius, Font, and Letter Spacing sections.
  4. Deleted empty `[owner]/[repo]/settings/layout.tsx` (was just `<>{children}</>`).
- **Reason for change**: Reduce duplication and fix rule violations found during code structure audit.

## Deduplicate shared utilities across backend workflows - 2026-03-07

- **Why**: 80+ Convex files had copy-pasted `extractJsonBlock` (3 copies), `new LlmJson(...)` (7 copies), and identical workflow completion event validators (10 copies). This duplication made changes error-prone — fixing a bug in one copy meant hunting down all others.
- **Changes**:
  1. Centralized `extractJsonBlock` and `llmJson` exports in `_taskWorkflow/helpers.ts`. Deleted local copies from `sessionAudits.ts` and `taskWorkflowActions.ts`.
  2. Added `workflowCompleteValidator` to `validators.ts`. All 10 workflow files now import it instead of defining identical inline validators.
  3. Extracted `resolveMessageUrls` helper in `messages.ts` to deduplicate `listByParent` and `listByParentInternal` handlers.
  4. Removed `as const` assertions from `sessionAudits.ts` and `projectInterviewWorkflow.ts` (violates codebase rule against `as`).
- **Reason for change**: Reduce duplication without adding abstraction layers. Only literal copy-paste was extracted.

## Multi-select type filter on logs page - 2026-03-06

- **Why**: The logs page type filter only allowed selecting one entity type at a time (radio buttons). Users needed to view multiple types simultaneously, matching the multi-select pattern already used on the quick tasks page.
- **Changes**:
  1. Replaced `logEntityTypeParser` (single string) with `logEntityTypesParser` (typed array) in search-params.
  2. Switched `LogsClient.tsx` from `DropdownMenuRadioGroup` to `DropdownMenuCheckboxItem` for multi-select.
  3. Updated backend `logs.listByRepo` to accept `entityTypes` (string array) instead of `entityType` (single string).
- **Reason for change**: Consistency with quick tasks filter UX; multi-select is more practical for log analysis.

## Change date filter from tabs to dropdown - 2026-03-06

- **Why**: Tabs took up more horizontal space and didn't match the adjacent entity type filter's dropdown pattern. A dropdown is more consistent and compact.
- **Changes**: Replaced `Tabs`/`TabsList`/`TabsTrigger` with `DropdownMenu`/`DropdownMenuRadioGroup` in `TimeRangeFilter`. Labels now show full text ("Last 7 days" etc.) instead of abbreviations. Affects both Logs and Stats pages.

## Improve task detail modal activity UX - 2026-03-06

- **Why**: Stop button was buried in the footer far from the activity it controls. User change request messages cluttered the request changes panel when they belong contextually next to the run they triggered.
- **Changes**:
  1. Moved the stop button from the modal footer to the right end of the Activity section header for proximity to what it controls.
  2. Added `IconEdit` indicator on agent runs triggered by user change requests (all runs after the first) to visually distinguish edits from initial runs.
  3. Added `IconMessageCircle` button in accordion triggers that opens a modal showing the user message that triggered that run.
  4. Removed user comment history from the request changes panel — messages are now accessible via the icon on each run.

## Mobile responsiveness audit for Quick Tasks page - 2026-03-06

- **Why**: Quick Tasks page components were not optimized for mobile viewports, leading to cramped layouts, poor touch targets, and usability issues on small screens.
- **Changes**:
  1. KanbanBoard: Added snap scrolling on mobile for smooth horizontal column navigation, increased min column width from 240px to 280px for better readability.
  2. QuickTasksClient: Added safe-area-inset-bottom padding to floating selection bar, improved padding and backdrop blur for mobile touch comfort.
  3. QuickTaskModal: Reduced textarea from 12 rows to 6 with responsive min-height, made dialog footer stack vertically on mobile.
  4. QuickTaskCard: Increased vertical padding on mobile for better touch targets.
  5. QuickTasksListView: Added bottom padding for scroll comfort and improved sticky header spacing.
  6. GroupTasksModal: Added responsive max-width to prevent overflow on very small screens.

## Mobile responsiveness audit for settings, stats, and inbox pages - 2026-03-06

- **Why**: Several pages had layouts that broke or overflowed on mobile viewports - horizontal flex rows with no wrapping, tables without scroll containers, and text/buttons that squeezed together.
- **Changes**:
  1. **LogsClient**: Converted 4 stat cards from `flex` to `grid grid-cols-2 lg:grid-cols-4`. Made log entry rows stack vertically on mobile with `flex-wrap`.
  2. **SnapshotsClient**: Made status grid responsive (`grid-cols-1 sm:grid-cols-2`), added horizontal scroll to builds table, made cron guide stack vertically on mobile, made config header and save row wrap properly.
  3. **EnvVarsTable**: Added horizontal scroll wrapper to table, made header description + buttons stack on mobile.
  4. **ThemeSettingsClient**: Tightened appearance mode grid spacing on small screens, made preview text smaller on mobile.
  5. **TimeRangeFilter**: Shortened tab labels and reduced padding for mobile fit.
  6. **InboxClient**: Collapsed "Mark all read" to icon-only on mobile, tightened notification item padding and gap.

## Watchdog consolidation + shared streaming cleanup - 2026-03-06

- **Why**: `workflowWatchdog.ts` had 8 handlers with identical cancel-workflow + clear-streaming preambles (6 of 8 repeated the same 5-line inline streaming cleanup). Separately, 15+ workflow files inlined the same 4-line `query("streamingActivity").withIndex(...).first(); if (streaming) delete` pattern instead of using the existing `clearStreamingActivity` helper.
- **Changes**:
  1. Extracted `cancelStaleWorkflow(ctx, workflowId, streamingEntityIds)` helper in `workflowWatchdog.ts` that cancels the workflow + clears streaming for a list of entity IDs. All 6 handlers that had both operations now call this single function.
  2. Replaced 15 inline streaming cleanup patterns across 10 workflow files (`sessionWorkflow`, `designWorkflow`, `designSessions`, `docInterviewWorkflow`, `docPrdWorkflow`, `evaluationWorkflow`, `projectInterviewWorkflow`, `researchQueryWorkflow`, `summarizeWorkflow`, `testGenWorkflow`) with `clearStreamingActivity()` imported from `_taskWorkflow/helpers.ts`.
- **Reason for change (architectural)**: Single source of truth for streaming cleanup logic. Bug fixes to the cleanup pattern now propagate everywhere.

## Simplify backend/convex: dedup error classification, consolidate sandbox reuse, fix N+1 queries - 2026-03-06

- **Why**: Codebase had grown organically with duplicated error classification logic (inline in execution.ts vs function in recovery.ts), near-identical sandbox startup try-reuse blocks in sessions.ts, and sequential db.get/query loops (N+1) in analytics and agentTasks queries that hurt both readability and performance.
- **Changes**:
  1. Moved `isDaytonaNetworkIssue()` from `_taskWorkflow/recovery.ts` to `_daytona/helpers.ts` (canonical location). Replaced 30-line inline error marker logic in `execution.ts` with a single function call. Re-exported from recovery.ts to preserve existing imports.
  2. Extracted `tryReuseSandbox()` helper in `_daytona/sessions.ts` to consolidate the duplicated "get existing sandbox → prepare → return or fall through" pattern shared by `startSessionSandbox` and `startDesignSandbox`.
  3. Converted sequential `for` loops with `ctx.db.get()` / `ctx.db.query()` to `Promise.all` in `analytics.ts` (5 N+1 patterns across getImpactStats, getActiveUsers, getActivityTimeline, getLeaderboard) and `_agentTasks/queries.ts` (getDependentTasks, getStatusesByIds).
- **Reason for change (architectural)**: Error classification is Daytona-specific and should live in the Daytona module. Sandbox reuse is a shared lifecycle pattern. N+1 queries cause unnecessary sequential round-trips in Convex queries.

## Consolidate duplicated Daytona operational logic - 2026-03-06

- **Why**: The "sign JWT token + launch script on sandbox" pattern was duplicated across 4 call sites (`execution.ts` 2x, `audit.ts` 2x). A bug fix or enhancement to this flow required changes in 4 places. Additionally, `getDaytona()` and `WORKSPACE_DIR` were redefined in `pty.ts` and `snapshotActions.ts` instead of importing from the canonical `_daytona/helpers.ts`.
- **Changes**:
  1. Added `signAndLaunchScript()` helper in `_daytona/helpers.ts` that composes token signing + script launch into a single call.
  2. Updated `_daytona/execution.ts` (`setupAndExecute`, `launchOnExistingSandbox`) and `_daytona/audit.ts` (`launchAudit`, `runSessionAudit`) to use the new helper.
  3. Removed local `getDaytona()` and `WORKSPACE_DIR` from `pty.ts` and `snapshotActions.ts`, importing from `_daytona/helpers.ts` instead.
- **Reason for change (architectural)**: Service layer consolidation — reusable operational mechanics should live in one place so bug fixes propagate to all callers.

## Harden quick-task watchdog resilience during callback finalization - 2026-03-06

- **Why**: Runs could emit `watchdog` heartbeat kills near the end of execution when callback finalization (media upload/completion mutation) outlived the previous heartbeat window, especially while Convex dev was reloading.
- **Changes**:
  1. `_daytona/callbackScript.ts` now keeps heartbeat/flush loops alive through finalization, adds an explicit `Finalizing response...` phase, and stops loops only after completion callback handling finishes.
  2. `_taskWorkflow/recovery.ts` increases heartbeat stale threshold from 90s to 180s and startup stale threshold from 10m to 15m to better tolerate transient backend reload/control-plane jitter.
  3. `_taskWorkflow/watchdog.ts` now formats heartbeat-kill error text from the configured threshold value so diagnostics stay accurate.
  4. `_daytona/execution.ts` increases transient Daytona setup retry budget (5 attempts) with longer exponential backoff to reduce surfaced 408 setup failures.
  5. `_taskWorkflow/watchdog.ts` now recognizes a streamed `"Finalizing response..."` phase and applies a longer stale threshold so completion/upload tail work is not killed prematurely.
  6. `_taskWorkflow/recovery.ts` adds a dedicated finalization stale threshold used by the watchdog for clearer phase-aware behavior without adding new run-state fields.
- **Reason for change (architectural)**: Finalization is a distinct lifecycle phase from active tool streaming; watchdogs should be strict enough to catch true hangs but tolerant of bounded callback/network jitter during shutdown paths.

## Add Geist font to theme settings - 2026-03-06

- **Why**: Users wanted Geist (Vercel's font) as an option in the theme font picker alongside the existing Google Fonts.
- **Changes**:
  1. Installed `geist` npm package for Next.js-compatible local font loading.
  2. Added `GeistSans` import and CSS variable (`--font-geist-sans`) to `apps/web/app/layout.tsx`.
  3. Extended `FontFamily` type and `FONT_FAMILIES` map in `ThemeContext.tsx` with the `"geist"` entry.
  4. Added `v.literal("geist")` to `fontFamilyValidator` in `packages/backend/convex/validators.ts`.

## Add font spacing (letter-spacing) to theme settings - 2026-03-06

- **Why**: Users had control over font family, accent color, border radius, and appearance mode but could not customize letter spacing, which significantly affects readability and visual feel.
- **Changes**:
  1. Added `letterSpacingValidator` and included it in `customThemeValidator` in Convex validators.
  2. Added `LetterSpacing` type and `LETTER_SPACING_VALUES` config to `ThemeContext.tsx`, applying the value to the `--tracking-normal` CSS variable.
  3. Added a "Font Spacing" section to the theme settings UI with five options: Tighter, Tight, Normal, Wide, Wider.

## Correlate quick-task callbacks and streaming by run id - 2026-03-05

- **Why**: Quick-task callbacks and streaming were keyed by `taskId`, so a stale sandbox from an older run could write activity or completion data into a newer retry. That made watchdog diagnosis noisy and created a path for cross-run interference.
- **Changes**:
  1. Task execution and task audit callback paths now pass `runId` through the sandbox environment and back into the completion mutations.
  2. Quick-task streaming is now written and read from run-scoped entity ids (`task-run-*` and `task-audit-run-*`) instead of a task-wide key.
  3. Task completion, audit completion, cancellation, stale-run cleanup, and task detail UI now all resolve activity against the active run id, while still clearing the legacy task-wide keys for compatibility cleanup.
- **Reason for change (architectural)**: A task can have multiple historical runs but only one active run. Runtime orchestration needs run-scoped correlation so retries and stale sandboxes cannot race through the same logical channel.

## Finalize evaluation workflow failures immediately - 2026-03-05

- **Why**: Evaluation reports could stay in `running` until the 2-hour watchdog when workflow startup failed before the sandbox callback path ever fired.
- **Changes**:
  1. `convex/evaluationWorkflow.ts` now catches early workflow failures, writes the report into its error state immediately through a guarded failure mutation, and then rethrows so the workflow component still records a failed run.
  2. `startEvaluation` now only attaches `activeWorkflowId` when the report has not already been finalized as an error.
- **Reason for change (architectural)**: Callback-driven workflows still need a direct failure path for pre-callback setup errors, otherwise app state lags far behind workflow state.

## Attach quick-task sandboxes earlier without startup watchdog regressions - 2026-03-05

- **Why**: Quick tasks still only persisted sandboxId after full sandbox preparation and callback launch readiness, so pre-launch stalls could surface as "sandbox was never attached" even when Daytona had already created the sandbox. Simply attaching earlier would have moved those runs onto the 90s heartbeat watchdog too soon, causing a different false positive during legitimate setup work.
- **Changes**:
  1. \_daytona/git.ts now exposes a sandbox-acquired callback during ephemeral sandbox creation, and \_daytona/execution.ts uses it to persist the run sandboxId as soon as Daytona returns the sandbox.
  2. \_taskWorkflow/workflowDefinition.ts now passes the run id into setupAndExecute so quick-task startup can attach the sandbox before repo prep and launch readiness finish.
  3. \_taskWorkflow/watchdog.ts now keeps runs on the longer startup watchdog window while streaming still shows Starting sandbox..., then switches to the 90s heartbeat watchdog only after callback activity replaces that startup state.
- **Reason for change (architectural)**: Sandbox acquisition and Claude heartbeat are different lifecycle phases. The watchdog needs phase-aware thresholds so earlier sandbox visibility does not create a new class of startup false positives.

## Improve quick-task startup visibility and Daytona timeout resilience - 2026-03-05

- **Why**: Quick tasks could sit in `running` with no visible activity during sandbox setup contention, and Daytona control-plane timeouts (`status code 408`) were not classified consistently in retry policy decisions.
- **Changes**:
  1. `convex/_taskWorkflow/runLifecycle.ts` now seeds `streamingActivity` as soon as a run transitions to `running` (`Starting sandbox...`) so the UI never shows an empty running state.
  2. `convex/_taskWorkflow/audit.ts` now seeds audit streaming state (`Starting audit...`) at audit creation time for the same reason.
  3. `convex/_daytona/execution.ts` now retries transient Daytona setup failures (including timeout/status-code patterns) with bounded exponential backoff before failing setup.
  4. `convex/_taskWorkflow/recovery.ts` now classifies Daytona HTTP timeout/server-status patterns (including 408) as Daytona-network issues.
- **Reason for change (architectural)**: Startup observability and transient-control-plane resilience should be first-class in orchestration, so operators see immediate progress while setup retries happen deterministically and bounded.

## Harden quick-task callback startup and JWT issuer consistency - 2026-03-05

- **Why**: Quick-task runs could appear as `running` with no Claude activity when the sandbox callback process started but could not authenticate back to Convex, or when JWT issuer config drifted between token signing and auth provider validation.
- **Changes**:
  1. Added callback readiness handshake in `_daytona/callbackScript.ts`: the script now writes `/tmp/run-design.ready` only after an authenticated `streaming:set` preflight succeeds.
  2. Strengthened `_daytona/launch.ts` startup verification: launch now waits for the readiness file, fails fast with tailed logs if readiness is never reached, and kills the orphaned process.
  3. Added `sandboxAuthConfig.ts` and centralized sandbox JWT issuer/JWKS constants; wired `auth.config.ts`, `sandboxJwt.ts`, and `http.ts` to the shared values so signing and validation cannot silently diverge.
- **Reason for change (architectural)**: Runtime orchestration should only mark a callback as started after callback-to-Convex authentication is proven, and auth-critical issuer configuration must come from one source of truth.
- **Follow-up fix**: corrected launcher env scoping so callback env vars (`CONVEX_URL`, `CONVEX_TOKEN`, etc.) are applied to `nohup node /tmp/run-design.mjs` (not only to the pre-cleanup command). This prevents `Failed to parse URL from undefined/api/mutation` startup failures.

## Break down agentTasks.ts into smaller modules - 2026-03-05

- **Why**: `agentTasks.ts` was 780 lines mixing queries, CRUD mutations, execution logic, draft management, and shared helpers in a single file. Finding and modifying specific functions required scrolling through unrelated concerns.
- **Changes**:
  1. Created `convex/agentTasks/helpers.ts` — `normalizeTaskTags`, `buildTaskNotificationMessage`, `agentTaskValidator`.
  2. Created `convex/agentTasks/queries.ts` — `listByProject`, `get`, `getActiveTasks`, `getAllTasks`, `getDependentTasks`, `getStatusesByIds`.
  3. Created `convex/agentTasks/mutations.ts` — `update`, `updateStatus`, `remove`, `createQuickTask`, `createQuickTasksBatch`, `assignToProject`, `deleteCascade`.
  4. Created `convex/agentTasks/execution.ts` — `startExecution`, `scheduleExecution`, `cancelScheduledExecution`, `updateScheduledExecution`.
  5. Created `convex/agentTasks/drafts.ts` — `listDrafts`, `saveDraft`, `activateDraft`.
  6. `agentTasks.ts` is now a barrel file that re-exports everything, preserving the `api.agentTasks.*` namespace for all frontend consumers.
- **Reason for change (architectural)**: Follows the same pattern established by `taskWorkflow/` — sub-modules own the logic, the top-level file owns the API surface. Convex re-exports are resolved at bundle time so all `api.agentTasks.*` paths remain intact.

## Break down taskWorkflow.ts into smaller modules - 2026-03-05

- **Why**: `taskWorkflow.ts` was 1550 lines with Convex function registrations, prompt builders, stale-run recovery logic, and shared DB helpers all in one file. This made navigation and maintenance difficult.
- **Changes**:
  1. Created `convex/taskWorkflow/prompts.ts` — `buildImplementationPrompt`, `buildAuditPrompt`, `buildWorkflowRunNotificationMessage`, `WORKSPACE_DIR`.
  2. Created `convex/taskWorkflow/recovery.ts` — `cleanUpStaleRun`, `isDaytonaNetworkIssue`, `buildQuickTaskRetryDelayMs`, stale-run timing constants.
  3. Created `convex/taskWorkflow/helpers.ts` — `clearStreamingActivity`, `upsertActivityLog`, `finalizeRunStatus`, `buildRunResultSummary`, `extractJsonBlock`.
  4. `taskWorkflow.ts` now imports from these modules. All Convex function registrations remain in place so API paths are unchanged.
- **Reason for change (architectural)**: Convex function definitions must stay in the original file (API path = filename), but pure helper logic can live in sub-modules. This keeps the orchestration layer slim while co-locating related helpers.

## Fix quick-task no-sandbox watchdog false positives - 2026-03-05

- **Why**: Quick tasks could be killed with `Run killed by watchdog: sandbox was never attached` while sandbox setup was still legitimately in progress, causing empty logs and unnecessary auto-retries.
- **Changes**:
  1. `taskWorkflow.updateRunToRunning` now resets `agentRuns.startedAt` when the run actually enters `running` instead of relying on the earlier queued timestamp.
  2. Increased `STALE_NO_SANDBOX_THRESHOLD_MS` from 3 minutes to 10 minutes to tolerate slower sandbox provisioning windows.
- **Reason for change (architectural)**: Watchdog deadlines should be measured from active execution start, not queue creation time, and pre-launch detection must be conservative enough to avoid killing valid in-flight provisioning.

## Simplify agentTasks, projects, taskWorkflow with shared helpers - 2026-03-05

- **Why**: Three backend files accumulated duplicated task-deletion logic, missing authorization checks on project mutations (security gap), and inconsistent cleanup in stale-run handling.
- **Changes**:
  1. Added 4 shared helpers to `functions.ts`: `getProjectWithAccess` (auth + fetch), `hasActiveRun` (index-based active run check), `isFirstTaskOnBranch` (handles both project and quick-task cases via `by_task_and_status` index), `deleteTaskRelatedData` (cancels scheduled function, deletes runs/deps/dependents/subtasks/task).
  2. `agentTasks.ts`: removed redundant dependency check in `updateStatus` (already covered by `workStatuses` block), replaced inline queries in `startExecution` with `hasActiveRun`/`isFirstTaskOnBranch`, replaced manual deletion in `remove`/`deleteCascade` with `deleteTaskRelatedData` (fixes missing subtask + scheduled cancellation).
  3. `projects.ts`: added authorization checks to 9 mutations that only checked existence (`update`, `addMessage`, `remove`, `clearMessages`, `updatePrUrl`, `updateProjectSandbox`, `clearProjectSandbox`, `updateLastSandboxActivity`, `updateLastConversationMessage`), replaced manual deletion in `deleteCascade` with `deleteTaskRelatedData` (fixes missing scheduled cancellation).
  4. `taskWorkflow.ts`: extracted `cleanUpStaleRun` local helper (workflow cancel → sandbox kill/delete → run patch → task patch → retry schedule → streaming cleanup), refactored `checkStaleRuns` and `handleStaleRun` to use it, replaced inline queries in `executeScheduledTask` with `hasActiveRun`/`isFirstTaskOnBranch`.
- **Benefit**: Fixes auth gaps on project mutations, ensures consistent cleanup (subtasks, scheduled functions) across all deletion paths, and reduces ~200 lines of duplicated code.

## Make quick-task execution atomic + pre-launch watchdog recovery - 2026-03-05

- **Why**: Quick tasks could get stuck as active with no real worker when the old two-step launch only partially succeeded, or when a run was marked `running` before sandbox attachment and never advanced.
- **Changes**:
  1. `agentTasks.startExecution` now starts `taskExecutionWorkflow` in the same mutation and sets `activeWorkflowId` server-side; if workflow start fails, it marks the run error and restores task state to `todo`.
  2. `taskWorkflow.checkStaleRuns` now treats `running` runs with missing `activeWorkflowId` as watchdog failures instead of returning early.
  3. `taskWorkflow.checkStaleRuns` now fails runs that never attach a `sandboxId` within a bounded window, cancels workflow state, resets task status, and schedules quick-task retry.
  4. Quick-task and task-detail frontend launch flows now call only `agentTasks.startExecution` (removed the second `triggerExecution` call).
  5. `taskWorkflow.triggerExecution` is now an idempotent fallback that no-ops when the run is no longer queued or the task already has an active workflow.
  6. `migrations.cleanupStaleRuns` now includes `in_progress` tasks even when `activeWorkflowId` is missing, so existing orphaned tasks can be repaired in one backfill run.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
- **Benefit**: Removes the main orphan-state path and tightens watchdog recovery for pre-launch hangs, so "running with no Claude process" self-heals instead of lingering.

## Split agentRuns activity log into dedicated table - 2026-03-05

- **Why**: `agentRuns.listByTask` still read the full `activityLog` field from each run document at DB level, so high-frequency list queries were paying for the heaviest payload even when UI loaded run logs lazily.
- **Changes**:
  1. Removed `activityLog` from `agentRuns` schema.
  2. Added `agentRunActivityLogs` table keyed by `runId`.
  3. Updated `agentRuns.complete` to upsert into `agentRunActivityLogs` when activity log is provided.
  4. Updated `agentRuns.getActivityLog` to read from `agentRunActivityLogs`.
  5. Simplified `agentRuns` list/get responses to return run docs directly (no activityLog stripping required).
- **Benefit**: `agentRuns.listByTask` no longer pulls activity log payloads from DB, reducing read bandwidth for task cards and task detail subscriptions.

## Project build branch now uses project/<projectId> - 2026-03-05

- **Why**: Project builds need all task commits and PR activity to stay on one deterministic branch tied to the project, not a mutable title slug.
- **Changes**:
  1. projects.startDevelopment now sets project branch to project/<projectId>.
  2. projects.createFromTasks now creates the project first, then sets branch to project/<projectId>.
- **Benefit**: Branch naming is stable, predictable, and consistent with the single-branch-per-project workflow.

## Real-time notification toasts + deep-link details - 2026-03-05

- **Why**: Users had to manually check notifications and couldn�t always tell what happened or jump directly to the right task/project context.
- **Changes**:
  1. Added `NotificationToastStream` to the main layout so new notifications surface immediately with an in-app toast.
  2. Updated notification popover item clicks to navigate directly to notification `href`, and added message previews so each item is actionable without opening a modal.
  3. Enriched backend notification messages for task assignment/completion, run completion, PR webhook events, and task comments.
  4. Quick-task notifications now always append `Quick task ID: <id>` automatically, and webhook notifications now pass `taskId`/`projectId` for exact deep links.
- **Benefit**: Notification UX is now real-time, clearer, and faster to act on, with direct navigation to exact destinations.

## Remove redundant `order` field + fix branch naming — 2026-03-05

- **Why**: `order` (0-based) and `taskNumber` (1-based) were redundant — both tracked task position. Quick task branches used `Date.now()` fallback producing unreadable names like `eva/task-1741209600000`.
- **Changes**:
  1. Branch naming changed from `eva/task-${taskNumber || Date.now()}` to `eva/task-${taskId}` — deterministic, unique, and tied to the actual task.
  2. Removed `order` field from `agentTasks` schema, all insert calls, and the validator.
  3. `getAllTasks` sort changed from `order` to `createdAt` (frontend was already re-sorting by `updatedAt` anyway).
  4. Ran migration to strip `order` from 100 existing documents.

## Harden quick-task retry orchestration + Daytona failure cleanup - 2026-03-05

- **Why**: Quick-task reliability still had three gaps after the first pass: retry scheduling only happened on workflow exceptions (not all error exits), sandbox creation failures could leak capacity before `sandboxId` was persisted, and callback HTTP calls could hang long enough to create false "stuck" runs.
- **Changes**:
  1. `taskWorkflow.ts` — replaced narrow retry path with centralized `maybeScheduleQuickTaskRetry` mutation (single retry chain, jittered backoff, latest-run guard, active-run guard), and wired it into all quick-task failure exits: normal callback failure, workflow catch, watchdog stale kill, and 2-hour timeout.
  2. `taskWorkflow.ts` — retry skip policy now lives in one place and explicitly skips auto-retry when error text matches Daytona network/connectivity issues.
  3. `daytona.ts` — `setupAndExecute` now deletes newly created sandboxes when setup/launch fails before successful handoff, preventing pre-run capacity leaks.
  4. `daytona/git.ts` — `createSandboxAndPrepareRepo` now deletes failed sandboxes on both first-attempt and retry-attempt prep failures.
  5. `daytona/callbackScript.ts` — added request timeouts and retry backoff for callback HTTP paths (Convex mutation/action calls and media upload URL flow), plus reduced default `CLAUDE_MAX_TOTAL_RUNTIME_MS` from 90m to 50m.
  6. `daytona/devServer.ts` — package manager detection now respects `rootDir` for session/design service startup in subdirectory repos.
- **Benefit**: Fewer leaked sandboxes, fewer long-hanging callback failures, and more consistent self-healing of quick-task failures without retrying Daytona network outages.

## Refactor daytona.ts into focused modules - 2026-03-05

- **Why**: At ~1800 lines, `daytona.ts` mixed sandbox lifecycle, git operations, callback script generation, desktop management, and dev server detection in a single file, making it difficult to navigate, understand, and maintain.
- **Changes**:
  1. Extracted helper functions into `convex/daytona/` folder with 7 focused modules: `helpers.ts` (core utilities), `volumes.ts` (session volume management), `git.ts` (repo clone/sync/branch), `callbackScript.ts` (sandbox callback template), `launch.ts` (script upload/fire), `desktop.ts` (xrandr/Chrome), `devServer.ts` (package manager/port detection).
  2. Eliminated 3 `as` type assertions in `detectDevPort` by introducing an `isRecord` type guard.
  3. Replaced deeply nested ternary in callback script's error field with a `buildErrorMessage` helper function.
  4. Consolidated duplicated lock file detection (`cloneAndSetupRepo` now reuses `detectPackageManager`).
  5. Extracted duplicated xrandr resolution setup into `setDisplayResolution`.
  6. Extracted repeated resolve-api-key/get-sandbox pattern into `getSandbox` helper.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
  8. Extracted duplicated media upload logic into `uploadMediaFile` within the callback script.
  9. Replaced `hasToolActivity` long `||` chain with a `Set` lookup.
- **Reason**: Main `daytona.ts` is now ~700 lines (actions only), each helper module is under 260 lines, and no circular dependencies exist. All external API references (`internal.daytona.*`, `api.daytona.*`) are unchanged.
- **Benefit**: Each concern is isolated and independently readable. TypeScript compiles with zero errors.

## Improve quick-task run robustness and batch start behavior - 2026-03-05

- **Why**: Some quick-task runs stayed on "Generating response..." until the 2-hour watchdog because failures before callback completion were not finalized immediately. Batch run actions also stopped on the first failing task, so only part of a selected set started.
- **Changes**:
  1. `taskWorkflow.ts` — wrapped `taskExecutionWorkflow` in fail-fast recovery: exceptions now finalize and complete the run immediately, always clear `activeWorkflowId`, and attempt ephemeral sandbox cleanup.
  2. `taskWorkflow.ts` — timeout/watchdog paths now also clean quick-task sandboxes (`checkStaleRuns` and `handleStaleRun`) to avoid leaked capacity.
  3. `daytona.ts` — callback script now enforces a max total runtime (`CLAUDE_MAX_TOTAL_RUNTIME_MS`, default 90 minutes) in addition to no-output timeout.
  4. `daytona.ts` — `launchScript` now verifies the callback process stays alive after launch (`/tmp/run-design.pid` + `kill -0`) and fails early with log tail if it exits immediately.
  5. `RunTasksModal.tsx`, `QuickTasksKanbanBoard.tsx`, `QuickTasksListView.tsx` — per-task error handling now continues launching remaining tasks instead of aborting the entire batch.
- **Benefit**: Failures surface quickly instead of aging into generic 2-hour timeouts, leaked quick-task sandboxes are cleaned up, and batch execution starts as many tasks as possible.

## Fix cost logging: correct field name + always log - 2026-03-05

- **Why**: Cost logs were always $0.00 because we read `cost_usd` from the stream-json result event, but the actual field is `total_cost_usd`. Also, the `> 0` guard silently skipped entries when cost was 0 or missing, making it impossible to diagnose.
- **Changes**:
  1. `daytona.ts` — `parsed.cost_usd` → `parsed.total_cost_usd` in `extractResultEvent()`.
  2. All 14 completion handlers — removed `costUsd > 0` guard so every invocation is logged (zero-cost entries still useful as audit trail).
  3. `schema.ts` / `validators.ts` — `entityType` changed from hardcoded validator to `v.string()` for resilience when adding/renaming workflows.
  4. Frontend — filter dropdown derives options from actual data instead of hardcoded list.
- **Benefit**: Actual dollar costs now flow through. New workflows auto-appear in the logs page without code changes.

## Optimize agentRuns.listByTask and projects.list database bandwidth - 2026-03-05

- **Why**: Both are live queries that transferred full documents on every mutation. `listByTask` sent the heavy `activityLog` string (full agent execution trace) for every run. `projects.list` sent `conversationHistory` (unbounded message array) and `generatedSpec` (large JSON) per project, plus ran N+1 queries to compute project phase from tasks on every read.
- **Changes**:
  1. `agentRuns.ts` — strip `activityLog` from `listByTask`, `listAll`, `get`, `getWithDetails` return types. New `getActivityLog` query for on-demand loading per run.
  2. `projects.ts` — strip `conversationHistory` and `generatedSpec` from `list` return. Removed on-read phase computation from `list` and `get`.
  3. `functions.ts` — new `recomputeProjectPhase` helper that persists phase transitions on write. Wired into `agentTasks.updateStatus`, `agentRuns.complete`, `agentRuns.updateStatus`, `agentTasks.activateDraft`.
  4. Frontend — new `RunActivityLog` component lazy-loads activity log per run via `getActivityLog` when accordion is expanded.
- **Benefit**: Eliminates N+1 queries from projects.list, removes heavy field transfer from list queries, phase is now computed on write instead of every read.

## CDP mode: agent-browser connects to VNC Chrome in sessions - 2026-03-04

- **Why**: agent-browser used its own headless Chromium, invisible to users. The VNC Desktop tab showed a separate Chrome. No way to watch agent-browser actions live.
- **Changes**:
  1. `daytona.ts` — new `startDesktopWithChrome` helper that starts VNC + Chrome with `--remote-debugging-port=9222`. Added `startDesktop` flag to `setupAndExecute`. Updated `launchChromeInDesktop` with CDP flag and `pgrep` idempotency guard.
  2. `sessionWorkflow.ts` — passes `startDesktop: true` so desktop auto-starts for sessions. Updated prompt with CDP detection: agent checks port 9222, uses `--cdp 9222` if available, falls back to headless otherwise.
- **Benefit**: Users can watch agent-browser actions in real-time through the Desktop tab during sessions. When CDP is unavailable, agent falls back to headless browser seamlessly.

## Cost logging for all Claude invocations - 2026-03-04

- **Why**: No visibility into how much each Claude run costs. Needed per-invocation cost tracking across all entity types (tasks, sessions, design sessions, research, docs, audits, etc.) and a UI to view/filter them.
- **Changes**:
  1. `daytona.ts` — extract `cost_usd` from stream-json `result` event, pass `costUsd` and `model` through completionArgs to all completion mutations.
  2. New `costLogs` table in schema with indexes for repo-scoped queries.
  3. New `costLogs.ts` backend with `log` internalMutation and `listByRepo` authQuery.
  4. All 14 completion handlers across 10 workflow files now insert into `costLogs` when `costUsd > 0`.
  5. New settings/logs page with TimeRangeFilter, entity type dropdown, total cost card, and collapsible groups by entity type.
- **Benefit**: Full cost visibility per repo — see what each task/session/audit costs, filter by date and type, view totals.

## Fix `scheduledFunctionId` type: `v.string()` → `v.id("_scheduled_functions")` - 2026-03-04

- **Why**: The field stored Convex scheduled function IDs but was typed as `v.string()`, forcing 6 `as Id<"_scheduled_functions">` casts and 2 unnecessary `String()` wraps across the codebase — violating the no-`as` rule.
- **Changes**: Used chicken-egg migration pattern (intermediate union type → clear stale data → final type). Removed all 6 `as` casts in `agentTasks.ts` and `githubWebhook.ts`, removed 2 `String(functionId)` wraps in write sites.
- **Benefit**: Convex schema is now the single source of truth for the type. No more manual type assertions.

## Task card UI redesign + unified Activity timeline - 2026-03-04

- **Why**: Task cards showed deployment dots, branch links, and dropdowns that cluttered the kanban board. Task activity (runs + webhook events) lived in separate sections. Needed cleaner card design and unified activity view.
- **Changes**:
  1. `QuickTaskCard.tsx` — removed deployment status dot, branch icon, and dropdown menu. Added footer showing task creator avatar + relative creation time (e.g. "3 days ago").
  2. `useTaskDetail.tsx` — merged Agent Runs and system comments into single **Activity** section sorted by date (newest first). System comments render as blue info cards.
  3. `taskComments.ts` — made `authorId` optional to support system-generated comments (no user context).
  4. `githubWebhook.ts` — creates system comment when PR is merged/closed via `createSystemComment` internalMutation.
  5. `QuickTasksKanbanBoard.tsx` + `QuickTasksListView.tsx` — pass `createdBy` and `createdAt` to card component.
- **Benefit**: Cleaner kanban board with less visual noise. Unified Activity timeline shows all events in chronological order. System events (PR lifecycle changes) visible without leaving the task detail.

## GitHub webhook: PR lifecycle → task status - 2026-03-04

- **Why**: When Eva opens a PR for a task, the task stays in `business_review`/`code_review` even after the PR is merged or closed on GitHub. Users had to manually move tasks to done/cancelled.
- **Changes**:
  1. `validators.ts` — new `webhookEventStatusValidator` (pending, completed, skipped)
  2. `schema.ts` — new `githubWebhookEvents` table for audit trail + `by_pr_url` index on `agentRuns` + `authorId` optional on `taskComments`
  3. `http.ts` — `POST /api/github/webhook` endpoint with HMAC-SHA256 verification via Web Crypto API
  4. `githubWebhook.ts` — **NEW** — `handlePrClosed` internalMutation: matches PR URL → agentRun → task, updates status to `done` (merged) or `cancelled` (closed), sends notifications, creates system comment, auto-completes project phase if all tasks done
  5. `taskComments.ts` — added `createSystemComment` internalMutation for webhook-triggered comments (no user context)
  6. `QuickTaskCard.tsx` — badge showing "PR Merged" (green) or "PR Closed" (red) when task status is done/cancelled with PR
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
- **Prerequisite**: Set `GITHUB_WEBHOOK_SECRET` env var in Convex. Configure webhook URL in GitHub App settings, subscribe to `pull_request` events.

## Vercel deployment status tracking - 2026-03-04

- **Why**: After Eva pushes code, Vercel builds a preview deployment but there's no visibility into the build status or preview URL. Users had to check Vercel manually.
- **Changes**:
  1. `validators.ts` — new `deploymentStatusValidator` (queued, building, deployed, error)
  2. `schema.ts` — added `deploymentStatus` + `deploymentUrl` fields to `agentRuns` table
  3. `agentRuns.ts` — updated return validator + added `updateDeploymentStatus` internal mutation
  4. `taskWorkflowActions.ts` — new `pollDeploymentStatus` self-scheduling action that polls GitHub Deployments API (60s intervals, max 20 attempts / ~20 min)
  5. `taskWorkflow.ts` — new `scheduleDeploymentTracking` mutation called after successful sandbox completion, sets initial "queued" status and schedules first poll
  6. `QuickTaskCard.tsx` — inline colored deployment status dot on card + "View Preview" dropdown item
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
- **Approach**: Uses GitHub Deployments API (not Vercel API directly). Vercel auto-creates GitHub Deployment records when building. Reuses existing GitHub App tokens — no new env vars. Provider-agnostic.
- **Prerequisite**: GitHub App needs `deployments:read` permission.

## Open-source Eva with MIT license - 2026-03-04

- **Why**: Make Eva publicly available under an open-source license while maintaining ownership of the codebase. MIT allows anyone to use, modify, and distribute freely without restrictions.
- **Changes**:
  1. `LICENSE` — MIT license with copyright holder (Vedant Bhopatrao)
  2. `CONTRIBUTING.md` — contributor guide with setup instructions, code style rules (no `any`/`unknown`/`as`), and PR guidelines
  3. `SECURITY.md` — responsible disclosure policy for vulnerability reports
- **Note**: Anyone can fork/modify privately or commercially, but must keep the MIT license. Contributes back to the original repo to avoid fragmentation.

## Fix agent-login redirect behind reverse proxy - 2026-03-04

- **Why**: When navigating to `/?agent` in the sandbox preview iframe (behind Daytona's reverse proxy), the auth redirect was pointing to `localhost:3000` instead of the external proxy domain, causing `net::ERR_CONNECTION_REFUSED`.
- **Changes**: `apps/web/app/api/auth/agent-login/route.ts` — use `X-Forwarded-Host` and `X-Forwarded-Proto` headers from reverse proxy to construct redirect URL instead of `request.nextUrl.origin` (which resolves to internal `localhost:3000`). This matches how Next.js middleware already handles forwarded headers automatically.

## VNC resolution + quality upgrade to 1920x1080 - 2026-03-04

- **Why**: VNC desktop rendered at 1024x768 (4:3) — looks wrong on modern 16:9 displays. noVNC quality=4 made text blurry. Agent-browser screenshots in quick tasks lacked proper viewport sizing.
- **Changes**:
  1. `rebuild-snapshot.yml` — added `x11-utils` to apt-get install (provides `xrandr` binary)
  2. `daytona.ts` `toggleDesktopServer` — after `computerUse.start()`, runs `xrandr --fb 1920x1080` with fallback to `--newmode`/`--addmode`/`--output`. Non-fatal if xrandr unavailable.
  3. `daytona.ts` `launchChromeInDesktop` — added `--start-maximized --window-size=1920,1080` to Chrome flags
  4. `DesktopPanel.tsx` — bumped noVNC quality from 4 to 6
  5. `taskWorkflow.ts` — added `agent-browser set viewport 1920 1080` step in proof-of-completion
  6. `sessionWorkflow.ts` — added viewport instruction to browser interaction rules
- **Note**: Snapshot rebuild required before xrandr takes effect. Desktop gracefully falls back to 1024x768 until then.

## Split TaskDetailModal into 3 files + inline 2-column layout - 2026-03-04

- **Why**: `TaskDetailModal.tsx` was ~1400 lines handling both modal and inline views. The inline (list view) panel also stacked everything vertically which wasted horizontal space.
- **Changes**:
  1. `useTaskDetail.tsx` — custom hook with all queries, mutations, state, handlers, and JSX section blocks
  2. `TaskDetailModal.tsx` — slim modal wrapper (~80 lines)
  3. `TaskDetailInline.tsx` — inline 2-column layout with 60:40 split (left: description/subtasks/runs, right: status fields + action buttons)
  4. Delete confirmation dialog extracted into hook return to avoid duplication
  5. Removed unused `formatDuration` function and `inline` prop from `TaskDetailModal`
- **Files**: `useTaskDetail.tsx`, `TaskDetailModal.tsx`, `TaskDetailInline.tsx`, `QuickTasksClient.tsx`

## Fix resultSummary for quick task re-runs - 2026-03-04

- **Why**: When requesting changes on a quick task, the run completed with "Pushed commit to project branch" even though quick tasks have no project branch.
- **Change**: `resultSummary` now shows "Pushed commit to project branch" only for project tasks; quick tasks show "Pushed commit to branch".
- **Files**: `taskWorkflow.ts` — `finalizeRunStreamingPhase` and `completeRun` now take project context into account.

## Replace taskDrafts table with draft status on agentTasks - 2026-03-04

- **Why**: Drafts are just tasks that haven't been submitted yet. A separate table duplicated the task schema and required separate CRUD functions. Using a status field keeps drafts as first-class agentTasks and eliminates the extra table.
- **Changes**:
  - Added `"draft"` to `taskStatusValidator`
  - Added `saveDraft`, `listDrafts`, `activateDraft` functions to `agentTasks.ts`
  - `getAllTasks` now excludes draft-status tasks so they don't appear on kanban/list views
  - `startExecution` guards against accidentally running a draft
  - `QuickTaskModal` rewired to use `agentTasks` draft functions instead of `taskDrafts` API
  - `taskDrafts.ts` deleted; `taskDrafts` table kept temporarily in schema for migration
  - Added `clearTaskDraftsTable` migration to `migrations.ts`

## Tighten all system/user prompts for concision - 2026-03-04

- **Why**: Prompts run on every sandbox invocation — redundant/verbose instructions waste tokens and dilute model attention. Repeated rules (e.g. "never push to main" appearing 3 times in one prompt) actually hurt compliance because the model wastes context parsing whether they're subtly different.
- **Changes across 7 files**:
  - `doc.ts`: Extracted shared `PRD_OUTPUT` template for `PARSE_PROMPT`/`GENERATE_PROMPT` (were near-identical). Merged overlapping "Your Role"/"Rules" sections in `INTERVIEW_PROMPT`.
  - `project.ts`: Removed duplicate "ground in real code" instructions, merged "Do NOT" rules into role section.
  - `sessionWorkflow.ts`: Collapsed 3 branch rules into 1 in `buildExecutePrompt`, tightened `buildAskPrompt` and `buildPlanPrompt`.
  - `design.ts` + `designWorkflow.ts`: Replaced full token listing with "use semantic tokens from globals.css", collapsed 6 setup steps into 2, removed overlap between system and user prompts.
  - `taskWorkflow.ts`: Condensed proof-of-completion section, merged overlapping "Do NOT" rules.
  - `evaluationWorkflow.ts`: Removed duplicate requirements listing between Phase 1 and Phase 2.
  - `researchQueryWorkflow.ts`: Removed duplicate "return ONLY raw query code", condensed analysis guidelines.

## Extract static prompts to prompts folder - 2026-03-04

- **Why**: Prompts were scattered across workflow files; harder to audit, tune, or share common patterns.
- **Change**: Added `packages/backend/convex/prompts/` folder with domain-split files: `shared.ts` (buildRootDirectoryInstruction, getResponseLengthInstruction), `doc.ts` (PARSE_PROMPT, INTERVIEW_PROMPT, GENERATE_PROMPT), `project.ts` (PROJECT_INTERVIEW_SYSTEM_PROMPT, TASK_PHILOSOPHY, SPEC_SYSTEM_PROMPT), `design.ts` (DESIGN_SYSTEM_PROMPT), `index.ts` (barrel export). Workflow-specific builders remain in their workflow files.
- **Reason for change (architectural)**: Partial extraction keeps dynamic builders co-located with workflow logic. Folder structure makes prompts easier to parse and navigate per domain.

## Task execution freeze protection: guardrails + heartbeat watchdog - 2026-03-04

- **Why**: Quick tasks froze at "Running command..." when Claude CLI ran blocking commands (e.g. `sleep 30`, hanging `gh api` calls). The 3-minute no-output timeout was too slow, and there was no server-side protection if the callback script itself died.
- **Phase 1 — Command guardrails + reduced timeout**:
  - `taskWorkflow.ts`: Added prompt rules requiring `timeout` prefix on all Bash commands, `GH_PROMPT_DISABLED=1` for `gh` commands, forbidding `sleep` and silent `2>/dev/null`
  - `daytona.ts`: Reduced `NO_OUTPUT_TIMEOUT_MS` default from 180s to 60s
  - `taskWorkflow.ts`: Made `handleCompletion` idempotent — ignores late/duplicate callbacks when run already finished
  - `schema.ts` + completion mutations: Added `exitReason` field to `agentRuns` for observability (`completed`, `error`, `run_timeout`, `watchdog_killed`)
- **Phase 2 — Heartbeat + stale run watchdog**:
  - `daytona.ts`: Added 10s heartbeat ping in callback script that force-sends `streaming:set` even during long-running Bash commands
  - `streaming.ts` + `schema.ts`: Added `lastUpdatedAt` timestamp to `streamingActivity` docs
  - `taskWorkflow.ts`: Added `checkStaleRuns` self-rescheduling mutation (every 30s) that kills runs with no heartbeat for 90s — cancels workflow, kills sandbox process, marks run as error
  - `schema.ts`: Added `sandboxId` and `repoId` on `agentRuns` so watchdog can call `killSandboxProcess`
- **Reason for change (architectural)**: Fire-and-forget sandbox execution needs layered timeout protection: prompt-level (prevent bad commands), process-level (60s no-output kill), server-level (90s heartbeat watchdog), and global safety net (2h run timeout).

## Prevent sandbox runs from hanging on blocked CLI commands - 2026-03-04

- **Why**: Some quick tasks appeared frozen at "Running command..." when a Bash step blocked on non-interactive CLI behavior or produced no stream output for a long time.
- **Fix** (`daytona.ts` callback script): Force GitHub CLI non-interactive defaults (`GH_PROMPT_DISABLED=1`, `GH_NO_UPDATE_NOTIFIER=1`) and normalize token env (`GH_TOKEN` from `GH_TOKEN`/`GITHUB_TOKEN`) before spawning Claude.
- **Fix** (`daytona.ts` callback script): Added a no-stdout watchdog for Claude attempts (`CLAUDE_NO_OUTPUT_TIMEOUT_MS`, default 180000ms). If no stdout arrives past the threshold, the child process is terminated and completion returns an explicit timeout error instead of hanging indefinitely.
- **Reason for change (architectural)**: Fire-and-forget sandbox jobs still need bounded execution semantics at the process level to avoid indefinite workflow stalls when tool subprocesses block.

## Fix "Not authenticated" on manual reload - 2026-03-04

- **Why**: On full page reload (e.g. staging URL), auth-dependent Convex queries ran before Clerk rehydrated the session from cookies, causing "Not authenticated" errors.
- **Fix**: Centralize auth gating in ClientProvider using Convex `AuthLoading` + `Authenticated`. Show spinner while auth is loading; only render ThemeProvider and children when authenticated. ThemeContext, PresenceHeartbeat, and RepoContext no longer need per-component skip logic.

## Cleanup legacy migrations - 2026-03-04

- Removed one-time migrations from `migrations.ts`: `assignOrphanRepos`, `createPersonalTeamsAndMigrate`, `removeTeamSlugs`, `migrateBoardsAndCommentsToUserIds`, `renameMcpServerToMcp`. Kept `cleanupStaleRuns` (operational — fixes stuck task runs when run manually).

## Remove boards/columns tables — status-based tasks - 2026-03-04

- **Why**: Boards and columns added indirection between repos and tasks. Tasks now use `status` directly; board/column was redundant.
- **Schema**: Removed `boards` and `columns` tables. Removed `boardId`/`columnId` and indexes `by_board`, `by_column`, `by_board_and_status` from `agentTasks`.
- **Migration** (`migrations.removeBoardsAndColumns`): Already run. Patches all agentTasks to clear `boardId`/`columnId`, deletes all columns, deletes all boards.
- **Backend**: `agentTasks` uses `by_repo` index; `hasTaskAccess` replaces `hasBoardAccess` everywhere. `projects.startDevelopment` creates tasks with `repoId`, `status`, `order` only. `taskWorkflow.executeScheduledTask` uses `task.createdBy` instead of `board.ownerId`. `analytics` queries tasks by `by_repo`. Removed `getAccessibleBoards` and `hasBoardAccess` from `functions.ts`. `repoUtils.hasRepoReferences` no longer checks boards.
- **Reason for change (architectural)**: Tasks belong to repos (and optionally projects). Status-driven workflow replaces column-based layout.

## Remove unused Convex functions - 2026-03-04

- **auth.createOrMigrateUser**: Deleted. Web app uses `ensureUserExists` (ClientProvider) for user creation on sign-in.
- **githubRepos.remove**: Deleted. No delete/disconnect flow in the app; team unassignment uses `removeFromTeam` instead.
- **auth.isCurrentUserAdmin**: Deleted. No admin UI in the app.
- **boards.ts**: Deleted entirely. Board/column data created by `agentTasks.createQuickTask`, `agentTasks.createQuickTasksBatch`, `projects.createFromTasks`. Access via `functions.getAccessibleBoards` and `agentTasks.getAllTasks`.
- **columns.ts**: Deleted entirely. Columns created inline with boards by agentTasks and projects.
- **routines.ts**: Deleted entirely. Routines feature not implemented.
- **analytics**: Removed `getTaskStats`, `getRunStats`, `getSessionStats`, `getProjectStats`. App uses `getImpactStats`, `getActiveUsers`, `getActivityTimeline`, `getLeaderboard`.
- **extensionReleases.getLatest**: Removed. HTTP routes use `getLatestInternal`.
- **taskDependencies**: Removed `getForTask`, `getDependents`, `getDependencies`, `add`, `remove`, `removeByTasks`. App uses `isBlocked` only.
- **projectInterviewWorkflow.startSpec**: Removed. App uses `startInterview` for the main flow.

## Query optimization — eliminate full table scans - 2026-03-03

- **Why**: `boards.list`, `agentRuns.listAll`, and `agentTasks.getActiveTasks` scanned ENTIRE tables (`boards`, `agentTasks`, `agentRuns`, `githubRepos`) then post-filtered in JS. This doesn't scale as data grows.
- **New indexes** (`schema.ts`): `agentTasks.by_board_and_status` and `agentRuns.by_task_and_status` enable targeted queries instead of full collects.
- **Shared helper** (`functions.ts`): `getAccessibleBoards(db, userId)` replaces the repeated pattern of "collect all boards → check access per board". Queries `boards.by_owner` + `teamMembers.by_user` → `githubRepos.by_team` → `boards.by_repo` — all indexed.
- **`boards.list`**: Replaced `ctx.db.query("githubRepos").collect()` (full repo scan) with the shared helper.
- **`agentRuns.listAll`**: Replaced 3 full table scans (boards, agentTasks, agentRuns) with shared helper → indexed fan-out through boards → tasks → runs.
- **`agentTasks.getActiveTasks`**: Replaced `ctx.db.query("boards").collect()` with shared helper.
- **`agentTasks.startExecution`**: Replaced loading ALL runs per project task (twice) with `by_task_and_status` index queries that short-circuit on first match.
- **`sessions.getOrCreateExtensionSession`**: Replaced Convex `.filter()` (post-index scan) with `by_repo_and_status` index + JS `.find()`.

## Fix handleStaleDoc branching + add sessionAudits watchdog - 2026-03-03

- **handleStaleDoc bug** (`workflowWatchdog.ts`): The if/else-if chain checked `interviewHistory` before `testGenStatus`, so docs with interview history AND `testGenStatus === "running"` would skip the test-gen error cleanup. Fixed by checking both conditions independently and applying a single patch.
- **sessionAudits watchdog** (`sessionAudits.ts`, `workflowWatchdog.ts`): `sessionAudits` uses a fire-and-forget callback pattern (not `awaitEvent`), so it was missed in the initial watchdog sweep. Added `handleStaleSessionAudit` handler and scheduled it from `startAudit` with `RUN_TIMEOUT_MS`. If the audit is still `"running"` after 2 hours, it's marked as `"error"`.

## Add watchdog timeouts to all workflows - 2026-03-03

- **Why**: Only `taskExecutionWorkflow` had a watchdog. All other workflows (session, design, research query, evaluation, doc interview, doc PRD, test gen, project interview, build) could hang forever if the sandbox callback failed after retries exhausted.
- **New file** (`workflowWatchdog.ts`): Centralized timeout constant (`RUN_TIMEOUT_MS = 2h`) and 7 entity-type handlers: `handleStaleSession`, `handleStaleDesignSession`, `handleStaleResearchQuery`, `handleStaleEvaluation`, `handleStaleDoc`, `handleStaleProject`, `handleStaleBuild`. Each cancels the workflow, clears streaming, clears `activeWorkflowId`, and does entity-specific cleanup (error messages, status updates).
- **Start mutations modified**: All 13 `start*` mutations now schedule the appropriate watchdog via `ctx.scheduler.runAfter(RUN_TIMEOUT_MS, ...)`. Each watchdog guards against stale timers by comparing `workflowId`.
- **Build integration** (`taskWorkflow.ts`): `handleStaleRun` now sends `buildTaskDoneEvent` when the timed-out task is part of an active build, so the build workflow unsticks too.
- **Shared constant**: `RUN_TIMEOUT_MS` moved from `taskWorkflow.ts` to `workflowWatchdog.ts`. Both `taskWorkflow.ts` and `migrations.ts` import from the shared location.

## Increase quick-task watchdog timeout to 2 hours - 2026-03-03

- **Why**: Some valid quick-task runs can exceed 45 minutes; the previous watchdog acted as a hard cap and timed out long-running executions.
- **Change** (`taskWorkflow.ts`): Updated `RUN_TIMEOUT_MS` from 45 minutes to 2 hours and aligned the stale-run error text to "Run timed out after 2 hours".
- **Reason for change (architectural)**: Keep watchdog protection for genuinely stuck runs while allowing realistic long-running agent tasks to complete.

## Fix quick task hanging at "Generating response" - 2026-03-03

- **Why**: When `convex dev` reloads mid-execution, the sandbox's HTTP POST to Convex fails. The script exits without retrying, so the workflow's `awaitEvent` hangs forever — the UI shows "Generating response..." indefinitely.
- **Fix 1 — Retry** (`daytona.ts`): Added `callMutationWithRetry` with exponential backoff (1s→16s, 5 retries) to the sandbox callback script. Applied at both completion call sites (success + error). Non-critical calls (streaming, screenshots) left as-is.
- **Fix 2 — Watchdog** (`taskWorkflow.ts`): Added `handleStaleRun` internalMutation + 45-minute timeout scheduled from `updateRunToRunning`. If the run is still active after 45 min, cancels the workflow, marks run as error, resets task to `todo`. If main run succeeded but audit hung, moves task to `business_review`. Guards against killing newer runs via run ID check.
- **Fix 3 — Backfill** (`migrations.ts`): Added `cleanupStaleRuns` one-time migration to fix already-stuck tasks. Only touches runs older than 45 min cutoff. Cancels workflows, marks stale runs/audits as error, clears streaming.

## GitHub repo/app rename resilience - 2026-03-03

- **Why**: When a GitHub repo is renamed (conductor → eva) or a monorepo app directory is renamed (apps/mcp-server → apps/mcp), `upsert` matched by `(owner, name, rootDirectory)` and created duplicate rows. Old rows lingered as stale cards on the home page with broken API calls.
- **Schema**: Added `githubId` (GitHub's numeric repo ID) to `githubRepos` with `by_github_id` index. Added `by_repo` indexes to `agentTasks` and `notifications` for efficient reference checking.
- **Upsert/Create**: Now match by `githubId` + `rootDirectory` first, falling back to `owner/name`. When a match is found with different `owner`/`name`, the row is patched (rename detected) instead of creating a duplicate. Existing rows without `githubId` get it backfilled.
- **Sync**: Removed `connectedParents` cascade from `syncConnectedStatus` — sub-app rows are only `connected: true` if explicitly in `connectedIds`. Added `cleanupStaleSubApps` to delete stale sub-app rows that are disconnected, sync-created (no `connectedBy`), not in detected paths, and have no data references.
- **Migration**: Added `renameMcpServerToMcp` to rename existing `apps/mcp-server` rows to `apps/mcp`, re-pointing references if a target row already exists.
- **Shared utility**: Created `repoUtils.ts` with `hasRepoReferences` (checks all 14 tables with `repoId`) and `normalizePath` (strips leading/trailing slashes, converts empty to `undefined`).
- **Reason for change (architectural)**: GitHub's numeric repo ID is immutable across renames and is the correct primary key for matching. The previous `(owner, name)` matching was fragile to renames, a known GitHub operation.

## Split task run streaming from audit streaming - 2026-03-03

- **Why**: Quick task execution UI could appear stuck at "Generating response..." because the run stayed `running` until audit finished. Users could not clearly see the main run had ended and audit had begun.
- **Workflow change** (`taskWorkflow.ts`):
  1. Added `finalizeRunStreamingPhase` internal mutation.
  2. `taskExecutionWorkflow` now calls it immediately after the main Claude callback (and PR creation), before launching audit.
  3. This mutation marks the run complete (`success`/`error`), persists `activityLog`, and clears the task streaming entity so run streaming closes promptly.
- **Completion safety** (`taskWorkflow.ts`):
  1. `completeRun` now only patches run status/details when the run is still `queued`/`running`.
  2. This prevents the final task-completion step from overwriting an already-finalized run while still handling task status updates, notifications, subtasks, and project updates.
- **Reason for change (architectural)**: Split lifecycle phases explicitly:
  1. Phase A: agent run execution + stream finalization.
  2. Phase B: post-execution audit streaming in its own section.
     This keeps realtime UX accurate without coupling task completion state to audit runtime.

## Remove deploy key from sandbox callback script - 2026-03-03

- **Why**: With self-signed 24h JWTs working, the deploy key auth path in the sandbox callback script is redundant. The JWT path (`callMutation`) handles everything: streaming, task proof, completion. The deploy key was originally needed because Clerk JWTs expired mid-execution.
- **Removed from callback script**: `DEPLOY_KEY`/`COMPLETION_HTTP_PATH` env vars, `callHttpEndpoint()` function, all deploy key branching logic.
- **Removed from `launchScript`**: `deployKey` option and env var injection.
- **Removed HTTP endpoints**: `/api/sandbox/task-completion` and `/api/sandbox/task-proof` from `http.ts` — only called by the callback script.
- **Removed internal mutations**: `taskWorkflow:handleScheduledCompletion`, `taskProof:saveInternal`, `taskProof:saveMessageInternal` — only called by those HTTP endpoints.
- **Note**: `EVA_DEPLOY_KEY` env var and `verifyDeployKey` in `http.ts` remain — still used by MCP routes.

## Fix self-signed JWT validation via customJwt provider - 2026-03-03

- **Why**: The `{ domain, applicationID }` auth config format uses OIDC discovery, which requires Convex to fetch `/.well-known/openid-configuration` from its own HTTP endpoint — a self-referential request that fails silently. Sandboxes could not authenticate JWT-based calls (`streaming:set`, etc.), causing zero streaming activity in the frontend.
- **Fix**: Switched to `{ type: "customJwt", issuer, jwks, algorithm }` format with the JWKS embedded as a base64 data URI. This provides the public key directly in the config — no HTTP fetching needed.
- **Key learning**: Convex `{ domain }` auth providers use OIDC discovery. Convex `{ type: "customJwt" }` providers accept `issuer` + `jwks` (URL or data URI) + `algorithm` directly. Use `customJwt` when you control the JWT signing and don't need full OIDC. The `jwks` field supports `data:application/json;base64,...` to avoid external HTTP calls entirely.
- **Also added**: `/.well-known/openid-configuration` HTTP endpoint (still useful for debugging, not required for auth).

## Self-signed sandbox JWTs (Phase 2) - 2026-03-02

- **Why**: Frontend-generated Clerk JWTs (1h expiry) were threaded through workflows to sandbox env vars. Long sandbox tasks could fail when the JWT expired. Scheduled tasks had no JWT at all (`convexToken: ""`).
- **Solution**: Backend now generates its own 24h JWTs signed with an EC P-256 key pair. Convex validates them via a `customJwt` auth provider with the public key embedded as a data URI.
- **New file**: `sandboxJwt.ts` — `signSandboxToken` internalAction that mints a JWT with the user's `clerkId` as `sub`, our `CONVEX_SITE_URL` as issuer, and `"convex"` as audience.
- **auth.config.ts**: Added `customJwt` provider with base64-encoded JWKS data URI so Convex validates both Clerk JWTs (frontend) and our self-signed JWTs (sandbox).
- **http.ts**: Added `GET /.well-known/jwks.json` and `GET /.well-known/openid-configuration` routes (JWKS endpoint still useful, OIDC endpoint for debugging).
- **daytona.ts**: All 4 sandbox-launching actions (`setupAndExecute`, `launchOnExistingSandbox`, `launchAudit`, `runSessionAudit`) now take `userId` instead of `convexToken`, and generate the JWT internally.
- **All workflow files**: Changed `convexToken: v.string()` → `userId: v.id("users")` in workflow args. Public mutations no longer accept `convexToken` — they pass `ctx.userId` from the auth context.
- **Frontend**: Deleted `useConvexToken.ts` hook. Removed `convexToken` from all 14 web mutation calls and 2 chrome extension mutation calls.
- **Env vars required**: `SANDBOX_JWT_PRIVATE_KEY`, `SANDBOX_JWT_JWKS` (set on Convex dashboard before deploying).

## Lock down public Convex functions (Phase 1) - 2026-03-02

- **Why**: Many backend functions were plain `query`/`mutation`/`action` with no auth — anyone with the Convex URL could call them. This converts all public functions to `authQuery`/`authMutation`/`authAction` so the auth gate rejects unauthenticated requests.
- **Converted to auth wrappers**:
  - `streaming.ts`: `get` → authQuery, `set`/`clear` → authMutation
  - `screenshots.ts`: `generateUploadUrl` → authMutation, `attachMedia` → authAction
  - `githubRepos.ts`: `list`/`get`/`getByOwnerAndName`/`listByTeam` → authQuery, `assignToTeam`/`removeFromTeam` → authMutation. Removed manual `getCurrentUserId` calls in favor of `ctx.userId`.
  - `users.ts`: `get` → authQuery
  - `taskAudits.ts`: `getByTask` → authQuery
  - `taskWorkflow.ts`: `handleAuditCompletion` → authMutation
  - `presence.ts`: `list` → authQuery, `disconnect` → authMutation
  - `sessions.ts`: `getOrCreateExtensionSession` → authMutation, removed `clerkId` arg (uses `ctx.userId`)
- **Dead code deleted**: `taskAudits.create`/`complete`/`fail`, `notifications.create`, `researchQueries.getSchemaInfo`
- **Intentionally kept public**: `extensionReleases` (extension auto-update + admin key), `auth` (bootstrapping)

## Fix session/sandbox UX issues + rootDirectory in all prompts - 2026-03-02

- **Summary streaming fix**: Summary and message execution shared the same streaming entity ID, causing the summary section to show message streaming data. Split into separate entity IDs (`summary:${sessionId}` vs `sessionId`) with independent queries.
- **Activity steps capped at 100**: Callback script was slicing accumulated steps to last 100 before streaming. Removed the cap.
- **VNC tab showing directory listing**: `appendNoVncParams` now injects `/vnc_lite.html` into the URL path.
- **rootDirectory in all prompts**: Added `rootDirectory` instruction to session (ask/plan/execute), task, design, and evaluation prompts so monorepo sessions work in the correct app.

## Always use deploy key for sandbox callbacks - 2026-03-02

- **Why**: Clerk JWTs expire in ~60s but sandbox tasks run for minutes. Three auth-required calls (`taskProof:save`, `taskProof:saveMessage`, `taskWorkflow:handleCompletion`) fail after JWT expiry. Previously only scheduled tasks used deploy key; now ALL sandboxes do.
- **Changes**:
  1. **`taskProof.ts`**: Added `saveInternal` and `saveMessageInternal` internalMutations — same logic as auth versions but without user ownership check (no user context in deploy key path).
  2. **`http.ts`**: New `POST /api/sandbox/task-proof` route — dispatches to `saveInternal` or `saveMessageInternal` based on request body shape. Verified via `verifyDeployKey`.
  3. **`taskWorkflow.ts`**: Fixed `handleScheduledCompletion` — changed `taskId` arg from `v.string()` to `v.id("agentTasks")` to remove `as Id<"agentTasks">` cast.
  4. **`daytona.ts`**: Always passes deploy key (removed `convexToken === ""` condition). Replaced `callHttpCompletion` with generic `callHttpEndpoint(path, args)`. Proof save/message calls now route through `/api/sandbox/task-proof` when deploy key available, fall back to `callMutation` when not.

## Task scheduling - 2026-03-02

- **Why**: Users need to schedule tasks to run at a future date/time instead of only running immediately via "Run Eva". Scheduled tasks require auth-free sandbox callbacks since the Clerk token expires before the task fires.
- **Changes**:
  1. **Schema**: Added `scheduledAt` and `scheduledFunctionId` fields to `agentTasks`.
  2. **`agentTasks.ts`**: Added `scheduleExecution`, `cancelScheduledExecution`, `updateScheduledExecution` mutations. Updated `startExecution`, `updateStatus`, `deleteCascade` to cancel schedules when appropriate.
  3. **`taskWorkflow.ts`**: Added `executeScheduledTask` (internalMutation, triggered by scheduler) and `handleScheduledCompletion` (internalMutation, called by HTTP endpoint).
  4. **`http.ts`**: New `POST /api/sandbox/task-completion` route — verifies deploy key and forwards to `handleScheduledCompletion`, bypassing Clerk auth.
  5. **`daytona.ts`**: Callback script conditionally omits auth header and uses HTTP completion endpoint when deploy key is present. `setupAndExecute` auto-detects deploy key mode when `convexToken` is empty.
  6. **Frontend**: New `SchedulePopover` component with calendar + time picker. Integrated into `TaskDetailModal` footer. Clock indicators on `QuickTaskCard` and `ProjectTaskCard`.

## Remove custom setup commands and env vars from snapshots - 2026-03-02

- **Why**: This platform only manages one repo's snapshots. Custom commands and env vars were designed for a multi-repo generic system. For a single repo, these belong directly in the workflow file, not managed dynamically from the platform. Runtime env vars are already handled by `resolveSandboxContext`.
- **Changes**:
  1. **Schema**: `customSetupCommands` and `customEnvVars` made optional (migration clears them).
  2. **`repoSnapshots.ts`**: Removed from `saveRepoSnapshot` args, `getRepoSnapshot` return, `getRepoSnapshotInternal` return. Migration clears fields from existing docs.
  3. **`snapshotActions.ts`**: Removed `custom_commands`/`custom_env_vars` from workflow dispatch inputs.
  4. **`rebuild-snapshot.yml`**: Removed dynamic Dockerfile injection, merged into single heredoc.
  5. **`SnapshotsClient.tsx`**: Removed custom commands textarea, env vars UI, and related state.
  6. **Added AI prompt** at `internal/prompts/update-rebuild-snapshot-workflow.md` for updating the workflow in the target repo.

## Replace fixed snapshot schedule with cron input - 2026-03-02

- **Why**: Fixed schedule presets (daily/every 3 days/weekly) were inflexible. Users should be able to specify any cron expression for snapshot rebuilds.
- **Changes**:
  1. **`validators.ts`**: `snapshotScheduleValidator` changed from union of literals to `v.string()` — accepts cron expressions or `"manual"`.
  2. **`repoSnapshots.ts`**: Replaced interval-based cron registration with `{ kind: "cron", cronspec }`. Added `resolveCronspec()` helper that handles both new cron strings and legacy preset values. Added `migrateScheduleToCron` for existing data.
  3. **`SnapshotsClient.tsx`**: Replaced Select dropdown with cron input field + preset buttons (Daily 6am, Every 3 days, Weekly Mon, Manual). Uses `cronstrue` to show human-readable translation below the input.

## Warm snapshot cache after rebuild - 2026-03-02

- **Why**: Sandbox creation from a snapshot has a cold start (~30s). After a daily snapshot rebuild at 6am, the first sandbox creation at 9am hits this cold start. By warming Daytona's cache immediately after rebuild, subsequent creations are fast.
- **Changes**:
  1. **`repoSnapshots.ts`**: `completeBuild` now schedules `warmSnapshotCache` when a build succeeds.
  2. **`daytona.ts`**: Added `warmSnapshotCache` internalAction — creates a sandbox from the snapshot then immediately deletes it. Best-effort, logs errors but never fails.

## Migrate Next.js API routes to Convex - 2026-03-02

- **Why**: Extension update and terminal PTY routes were unnecessary Next.js middlemen — they just authenticated and forwarded to Convex. Moving them to Convex eliminates the hop, reduces latency, and removes the dependency on Next.js server for these flows.
- **Changes**:
  1. **Extension updates → Convex HTTP routes**: Added `GET /api/updates/extension/updates.xml` and `GET /api/updates/extension/conductor.crx` to `http.ts`. Added `getLatestInternal` query to `extensionReleases.ts`. Deleted `apps/web/app/api/updates/extension/route.ts`.
  2. **Terminal PTY → Convex actions**: Created `packages/backend/convex/pty.ts` with `connectPty`, `resizePty`, `disconnectPty` actions. Added `updatePtySessionInternal` mutation to `sessions.ts`. Updated `TerminalPanel.tsx` to use `useAction` instead of `fetch`. Deleted `apps/web/app/api/sessions/terminal/route.ts`.
  3. **Cleanup**: Deleted `apps/web/lib/sandbox.ts` and `apps/web/lib/convex-auth.ts` (no other consumers). Updated Intune README, PowerShell script, and release script URL references.
  4. **Agent login**: Kept in Next.js — dev-only, Clerk-coupled, no benefit from moving.

## Proof of completion for quick tasks - 2026-03-02

- **Why**: Quick tasks execute via the same sandbox callback as sessions, but media proof never gets saved. The callback calls `screenshots:attachMedia` which only accepts session-type IDs — for tasks it fails silently. The `taskProof` table and `TaskDetailModal` display already exist but nothing populates them.
- **Changes**:
  1. **`daytona.ts`**: Callback script branches media attachment by entity type. Tasks call `taskProof:save` with fileName; sessions keep existing `screenshots:attachMedia`. When no media found for tasks, saves a "No UI changes" message via `taskProof:saveMessage`.
  2. **`taskWorkflow.ts`**: Added REQUIRED proof capture instructions to implementation prompt — agent must use agent-browser skill to screenshot/record after committing. Updated `git add` to exclude media files.
  3. **`schema.ts` + `taskProof.ts`**: Made `storageId`/`fileName` optional, added `message` field for text-only proofs. Removed `fileType` — now inferred from `_storage` metadata via `ctx.db.system.get`. Added `saveMessage` mutation.
  4. **`sessionWorkflow.ts`**: Added rule for sessions to use agent-browser when user asks for visual proof/screenshots.
  5. **`MediaPreview.tsx`**: Extracted `ScreenshotPreview` and `VideoPreview` from ChatPanel into shared component. Both TaskDetailModal and ChatPanel now import from the same source.
  6. **`TaskDetailModal.tsx`**: Proof section now single-column layout with proper preview components (click-to-expand screenshots, video with speed controls), supports text-only message proofs.

## Add GitHub labels to agent-created PRs - 2026-03-02

- **Why**: No way to distinguish agent-created PRs from human PRs, or to tell which part of the platform (project, quick-task, session) created them.
- **Changes**:
  1. **`taskWorkflowActions.ts`**: Added `labels` arg to `createPullRequest`, calls `octokit.rest.issues.addLabels()` after PR creation.
  2. **`taskWorkflow.ts`**: Passes `["eva", "project"]` or `["eva", "quick-task"]` based on whether task has a `projectId`.
  3. **`github.ts`**: Added `["eva", "session"]` labels to `createSessionPr` after PR creation.
- Labels auto-create in the repo if they don't exist yet.

## Team access control for all resources - 2026-03-02

- **Why**: When a user was added to a team, they could only see repos but not any of the repo's resources (boards, tasks, runs, sessions, projects, docs, etc). Board access was gated by `board.ownerId === userId`, and many resources had no repo access verification at all — any authenticated user could theoretically query them.
- **Changes**:
  1. **`functions.ts`**: Added `hasRepoAccess(db, repoId, userId)` — checks `connectedBy` OR team membership. Added `hasBoardAccess(db, board, userId)` — checks `ownerId` OR repo access.
  2. **Board-gated files** (`boards.ts`, `agentTasks.ts`, `columns.ts`, `subtasks.ts`, `agentRuns.ts`, `taskComments.ts`): Replaced all `board.ownerId !== ctx.userId` checks with `hasBoardAccess`. `boards.list` now returns owned + team repo boards. `boards.listByRepo` and `agentTasks.getAllTasks` now return ALL boards for accessible repos.
  3. **Owner-only mutations** (`sessions.archive`, `projects.deleteCascade`, `designSessions.archive`, `designPersonas.update/remove`, `researchQueries.remove`, `savedQueries.update/remove`, `routines.update/remove`): Replaced `resource.userId !== ctx.userId` with `hasRepoAccess` check.
  4. **Repo access verification** added to all `list`/`get` queries and `create` mutations across `sessions`, `projects`, `docs`, `designSessions`, `designPersonas`, `researchQueries`, `savedQueries`, `routines`, `evaluationReports`, and `analytics`.

## RepoSelect: hierarchical monorepo display + fixed spacing - 2026-03-02

- **Why**: RepoSelect had flat monorepo app listings with radio button padding wasting space. Multiple apps under the same repo were harder to visually group.
- **Changes**:
  1. **Removed radio buttons**: Switched from `DropdownMenuRadioItem` (has `pl-9` padding) to `DropdownMenuItem` for cleaner left alignment.
  2. **Hierarchical grouping**: Now groups by owner → repo → apps. Standalone repos show directly; monorepos show with the repo name as a sub-label and each app as a selectable item.
  3. **Selected value display**: Shows `name/appName` for monorepo entries (e.g. `carepulse-ts/eprocurement`), just `name` for standalone.

## Route restructure: `[repo]` → `[owner]/[repo]` - 2026-03-02

- **Why**: URLs like `/evalucom-carepulse-ts~apps~eprocurement` were ugly and unreadable. Clean URLs like `/evalucom/carepulse-ts/eprocurement` are more intuitive and shareable.
- **Solution**: Middleware rewrites 3-segment monorepo URLs (`/owner/repo/app/subpage`) to internal `--` encoding (`/owner/repo--app/subpage`), while `usePathname()` returns the clean original URL.
- **Changes**:
  1. **`middleware.ts`**: Added rewrite logic — if 3rd path segment is not a known sub-page (projects, sessions, etc.), rewrite URL with `--` separator.
  2. **`repoUrl.ts`**: Replaced `encodeRepoSlug`/`decodeRepoSlug`/`buildRepoPath` with `repoHref(owner, name, rootDirectory?)` and `decodeRepoParam(repoParam)`.
  3. **Route directory**: Moved `app/(main)/[repo]/` → `app/(main)/[owner]/[repo]/`. Layout now accepts `{ owner, repo }` params.
  4. **`RepoContext.tsx`**: Now takes `owner` + `repoParam` props, exposes `basePath`, `owner`, `name` instead of `repoSlug`/`fullName`.
  5. **`githubRepos.ts` (`getByOwnerAndName`)**: Changed `rootDirectory` arg to `appName` — matches by `rootDirectory.split("/").pop()`.
  6. **`Sidebar.tsx`**: Extracts `repoBasePath` from pathname instead of decoding a single slug segment. Passes `basePath` to all child sidebars.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.

## Monorepo Auto-Detection in Sync + Data Migration - 2026-03-02

- **Why**: Monorepo sub-apps required manual addition from the admin page. Existing root repo entries had sessions, tasks, etc. that needed migrating to their sub-app entries. Going forward, `syncRepos` should automatically detect and create monorepo sub-app entries.
- **Changes**:
  1. **Data migration**: Ran temporary mutations to move all data (14 tables) from root entries to sub-app entries for `evalucom/carepulse-ts` → `apps/eprocurement`, `vedantb2/vmem` → `apps/web`, and `vedantb2/conductor` → `apps/web`.
  2. **`github.ts` — `syncRepos`**: Now auto-detects monorepo apps for every repo on sync. Filters to `apps/` paths only, upserts sub-app entries with `rootDirectory`. Root entries are kept (not deleted) to avoid data loss.
  3. **`github.ts` — `detectAppsForRepo` helper**: Extracted from `detectMonorepoApps` action so both the action (manual use) and `syncRepos` (automatic) share the same logic.
  4. **`githubRepos.ts` — `syncConnectedStatus`**: Updated to mark sub-apps as connected when their ID is directly in `connectedIds` (not just via parent lookup).
  5. **`githubRepos.ts` — `deleteInternal`**: New internal mutation available for manual cleanup of root entries when safe.
- **Reason**: Eliminates manual monorepo setup. Sync now auto-creates sub-app entries under `apps/` while preserving root entries to prevent data orphaning.

## Monorepo App Picker — Settings Page + Home Page Quick Action - 2026-03-01

- **Why**: The monorepo detection backend (`detectMonorepoApps`) only worked from the setup page during initial GitHub App install, which auto-syncs and redirects before anyone can use it. Users needed a way to manage monorepo sub-apps after initial setup.
- **Changes**:
  1. **New admin page** (`/[repo]/admin/monorepo`): Server component + `MonorepoClient` — auto-detects workspace apps on mount via `detectMonorepoApps`, shows existing connected sub-apps, allows adding detected apps or custom root directories.
  2. **AdminSidebar**: Added "Monorepo" nav item with `IconFolders`.
  3. **ReposClient (home page)**: Added `...` dropdown menu on each repo card with "Manage apps" action that navigates to the monorepo admin page.
- **Reason**: Exposes monorepo management from two accessible locations — the repo settings page (full management) and the home page (quick access) — instead of only during the one-time setup flow.

## Monorepo Support — Root Directory per Repo Entry - 2026-03-01

- **Why**: Monorepos (e.g. `apps/web` + `apps/eprocurement`) had no way to specify which sub-app to start, inject per-app env vars, or run independent sessions. Each sub-app needs its own sandbox/dev server/environment.
- **Changes**:
  1. **Schema** (`schema.ts`): Added `rootDirectory` to `githubRepos`, `devPort` to `sessions` and `designSessions`.
  2. **githubRepos.ts**: Updated `create`, `getByOwnerAndName`, `upsert` to support `rootDirectory` — uniqueness is now `owner + name + rootDirectory`.
  3. **github.ts**: New `detectMonorepoApps` action — uses GitHub Contents API to detect workspace globs (npm/pnpm), list sub-apps, check for dev scripts.
  4. **daytona.ts**: Extracted `detectPackageManager` helper, added `detectDevPort` (parses dev script for port flags, falls back to framework defaults), implemented `startSessionServices` to start dev server in the correct root directory, returns detected port. Both `startSessionSandbox` and `startDesignSandbox` now fetch `rootDirectory` from repo and pass `devPort` to `sandboxReady`.
  5. **sessions.ts / designSessions.ts**: `sandboxReady` mutations accept and persist `devPort`.
  6. **repoUrl.ts**: Slug encoding now appends `~apps~web` for root directories (`/` → `~`). `decodeRepoSlug` returns `{ fullName, rootDirectory }`.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
  8. **RepoSelect.tsx**: Uses encoded slug as value, shows `rootDirectory` below repo name.
  9. **RepoSetupClient.tsx**: On "Add", calls `detectMonorepoApps` and shows expandable sub-app picker with checkboxes + custom path input.
  10. **ReposClient.tsx**: Card shows app name from root dir path, subtitle shows `owner/repo → apps/web`.
  11. **SandboxPanel.tsx / DesignDetailClient.tsx**: Uses `session.devPort` for preview port instead of hardcoded values.
- **Reason**: Enables connecting the same GitHub repo multiple times with different root directories, each with independent env vars, sessions, and sandbox configs — similar to Vercel's "Root Directory" project setting.

## Session Chat UX Fixes - 2026-03-01

- **Why**: Video recordings played at 1x (too slow to review), the stop button in the prompt input appeared teal instead of red, agent responses included unwanted meta-commentary (file paths, commit status), and streaming activity steps were capped at 30 making it look like steps were missing.
- **Changes**:
  1. **Video playback speed** (`ChatPanel.tsx`): `VideoPreview` now defaults to 3x playback via `useRef` + `onLoadedMetadata`. Speed selector buttons (1x/2x/3x/5x) below the video.
  2. **Stop button colour** (`ChatPanel.tsx`): `PromptInputSubmit` now passes `variant="destructive"` when executing, making the stop button red.
  3. **Cleaner agent response** (`sessionWorkflow.ts`): Execute prompt instruction updated to only describe actions/outcomes. Added rule to suppress recording/screenshot file paths, commit status, and process meta-commentary.
  4. **Streaming step cap** (`daytona.ts`): Increased `.slice(-30)` to `.slice(-100)` in both `flushStreaming` and retry path so streaming UI shows up to 100 steps instead of 30.

## Agent Screenshot & Video Upload to Convex Storage - 2026-03-01

- **Why**: The Claude CLI running inside the Daytona sandbox takes screenshots and records videos (via `agent-browser`) but had no way to persist or display them. Media needs to be stored in Convex file storage and rendered inline in the session chat so users can see agent activity. Additionally, media files were being accidentally committed to git because the prompt always forced commits. Intermediate screenshots during video recording should be discarded, not uploaded.
- **Changes**:
  1. **Schema** (`schema.ts`): Added optional `imageStorageId` and `videoStorageId` fields to messages table.
  2. **Messages** (`messages.ts`): Added `imageStorageId`, `imageUrl`, `videoStorageId`, `videoUrl` to validator. `listByParent`/`listByParentInternal` resolve storage IDs → URLs. `addInternal` accepts optional image/video IDs.
  3. **Screenshots action** (`screenshots.ts`): New public `upload` action for base64 images, `generateUploadUrl` mutation, and `saveVideoMessage` mutation for video metadata (supports large files via upload URL flow instead of base64).
  4. **Callback script** (`daytona.ts`): Post-execution directory scan of `screenshots/` and `recordings/` folders after Claude finishes. Uploads all videos, then skips uploading screenshots if any video exists (prevents intermediate frames from polluting chat). Auto-deletes media files after upload.
  5. **Execute prompt** (`sessionWorkflow.ts`): Changed `git add` to use pathspec exclusions (`:!*.png/:!*.webm/:!recordings/:!screenshots/`), and made commit conditional (`git diff --cached --quiet || git commit`) — prevents commits when no code changes exist and prevents media files from being tracked.
  6. **ChatPanel** (`ChatPanel.tsx`): New `ScreenshotPreview` and `VideoPreview` components with dialog lightbox — click to maximize, "Open in new tab" button, fullscreen display.

## Agent Browser Auth via Clerk Sign-In Tokens - 2026-03-01

- **Why**: Browser automation agents need to authenticate as a real user but can't navigate Clerk's interactive sign-in UI. A secret-protected API endpoint generates a one-time Clerk sign-in token and redirects to a callback page that establishes a real session programmatically.
- **Changes**:
  1. **Env vars** (`env/server.ts`): Added optional `AGENT_AUTH_SECRET` and `AGENT_CLERK_USER_ID`.
  2. **API route** (`app/api/auth/agent-login/route.ts`): Dev-only GET endpoint that validates a shared secret, creates a Clerk sign-in token, and 302 redirects to the callback.
  3. **Callback page** (`app/agent-callback/page.tsx`): Client component that consumes the ticket via `signIn.create({ strategy: "ticket" })`, establishes the session, and redirects to `/home`.
  4. **Middleware** (`middleware.ts`): Added `/agent-callback(.*)` to public routes.

## Add VNC Desktop Tab to Sessions - 2026-03-01

- **Why**: Users need to interact with a graphical desktop environment (and Chrome browser) running inside the Daytona sandbox for visual testing and UI automation. Daytona's SDK provides built-in VNC support via `computerUse.start()` which starts Xvfb + xfce4 + x11vnc + noVNC.
- **Changes**:
  1. **Backend action** (`daytona.ts`): New `toggleDesktopServer` action using Daytona SDK's `sandbox.computerUse.start()`/`stop()`.
  2. **Search params** (`search-params.ts`): Added `"desktop"` to `sandboxTabs` union.
  3. **DesktopPanel component** (new file): Follows `EditorPanel` pattern — on-demand VNC start, polls port 6080 for noVNC readiness, sessionStorage caching, fullscreen + open-in-new-tab buttons. Max 40 poll attempts (2 min) since VNC startup can be slower. Uses `appendNoVncParams` helper to safely append query params to signed URLs.
  4. **SandboxPanel wiring**: New desktop tab trigger with `IconDeviceDesktop`, conditionally rendered `DesktopPanel`.
  5. **Snapshot workflow** (`rebuild-snapshot.yml`): Added VNC packages (xvfb, xfce4, x11vnc, novnc, dbus-x11, X11 libs) and Google Chrome to the Dockerfile so new snapshots include desktop environment support.

## Persist preview & editor state across page refresh - 2026-03-01

- **Why**: Page refresh caused 9-30s loading delays as preview/editor URLs were re-polled, and code-server was restarted, killing previous terminal sessions and dev servers. Users had to manually restart dev servers on different ports.
- **Changes**:
  1. **Preview URL caching** (`SandboxPanel.tsx`): sessionStorage cache keyed by `{sessionId}:{port}`. On mount, use cached URL if present, skip polling entirely. Clear on sandbox inactive.
  2. **Editor URL caching & reuse** (`EditorPanel.tsx`): sessionStorage cache keyed by `{sessionId}`. `startEditor` checks if port 8080 is already responding before calling `toggleCodeServer`, avoiding unnecessary restarts.
  3. **Idempotent code-server start** (`daytona.ts`): Backend `toggleCodeServer` now guards start with `pgrep -f 'code-server.*8080'` — only starts if not already running. Existing terminals and dev servers survive.
  4. **Preview port persistence** (`search-params.ts`, `SandboxPanel.tsx`): Port stored in URL via nuqs (`?port=3000`) instead of useState, so custom ports survive refresh.
  5. **Extended signed URL expiry** (`daytona.ts`): Bumped from 3600s (1 hour) to 2592000s (30 days). Cache invalidated only when sandbox inactive (the only scenario where URLs stop working anyway).
- **Reason for change**: Improve UX by eliminating unnecessary loading/restart cycles on page refresh while maintaining clean session lifecycle.

## Extract messages into dedicated table - 2026-02-28

- **Why**: Messages were embedded as arrays inside `sessions`, `designSessions`, and `researchQueries` documents. Every read/write of a session fetched/rewrote the entire message array. As conversations grew, this caused large document sizes approaching the 1MB Convex limit, full array rewrites on every single message, and listing sessions in sidebars loaded all messages for all sessions wastefully.

- **Changes**:
  1. **New `messages` table** (`schema.ts`): Dedicated table with `parentId` (union of session/designSession/researchQuery IDs) and `by_parent` index. All message-specific fields (`mode`, `variations`, `queryCode`, `status`, etc.) live here.
  2. **New `messages.ts`**: Central CRUD hub with `listByParent`, `add`, `addInternal`, `updateLast`, `updateLastInternal`, `patchMessage`, `clearByParent`, `clearByParentInternal`.
  3. **Backend migration**: All mutation/query/workflow files (`sessions.ts`, `designSessions.ts`, `researchQueries.ts`, `sessionWorkflow.ts`, `designWorkflow.ts`, `summarizeWorkflow.ts`, `researchQueryWorkflow.ts`, `analytics.ts`) now read/write via the `messages` table.
  4. **Frontend migration**: All detail pages (`SessionDetailClient`, `DesignDetailClient`, `QueryDetailClient`, chrome extension `ChatPanel`) use separate `useQuery(api.messages.listByParent)` calls. Sidebars no longer load messages.
  5. **Data migration**: Ran paginated migration to copy all embedded messages into the new table, then cleanup migration to unset the old `messages` field from all documents, then removed the field from the schema.
  6. **Research queries**: `updateMessageStatus` now takes `messageId: Id<"messages">` instead of an array index, enabling direct patching.

## Hold task in in_progress until audit completes - 2026-02-27

- **Why**: Tasks were moving to `business_review` immediately after Claude CLI succeeded, before the post-execution audit finished. This meant reviewers could start reviewing code that hadn't been audited yet.

- **Changes**:
  1. **Workflow reorder** (`taskWorkflow.ts`): Swapped Steps 7 and 8 — audit now runs before `completeRun`. Task stays in `in_progress` while the audit runs, and only moves to `business_review` (or back to `todo` on failure) after the audit finishes. Audit remains non-fatal (wrapped in try/catch), so if it fails the task still completes normally.

## Fix Claude CLI prompt piping causing exit code 1 - 2026-02-27

- **Why**: Quick tasks (and all sandbox-based Claude executions) were failing with "Claude CLI exited with code 1" because the prompt was piped via `echo` + `JSON.stringify`, which: (1) turned real newlines into literal `\n` characters so Claude received an unreadable single-line prompt, (2) left `$` and backticks unescaped so bash shell expansion could mangle or break the command.

- **Changes**:
  1. **Prompt piping** (`daytona.ts`): Replaced `echo <JSON.stringify(prompt)> | npx ...` with `cat /tmp/design-prompt.txt | npx ...` — the prompt file is already uploaded with correct formatting, so just pipe it directly
  2. **Error diagnostics** (`daytona.ts`): Appended `stderrOutput` (last 500 chars) to the error message on CLI failure — previously stderr was captured but silently discarded, making failures impossible to diagnose

## Fix PR base branch + sandbox git repo fallback - 2026-02-27

- **Why**: PRs were always opened against `main` regardless of the base branch selected in the task modal. Additionally, sandboxes created from snapshots that lacked a git repo would crash instead of recovering.

- **Changes**:
  1. **PR base branch** (`taskWorkflowActions.ts`): `createPullRequest` now accepts a `baseBranch` arg and uses it instead of hardcoded `"main"`
  2. **Workflow passthrough** (`taskWorkflow.ts`): Passes `args.baseBranch` to `createPullRequest`
  3. **Sandbox git fallback** (`daytona.ts`): When `syncRepo` fails with "not a git repository" (snapshot missing `.git`), uses new `initGitInPlace` to `git init && fetch && reset --hard && clean -fd` — preserves snapshot's pre-installed `node_modules` instead of nuking everything with a full clone
  4. **Ephemeral sandbox cleanup** (`taskWorkflow.ts`): Standalone (non-project) tasks now pass `ephemeral: true` and explicitly delete their sandbox after workflow completion instead of relying on Daytona auto-delete
  5. **Session sandbox deletion** (`sessions.ts`): Stopping a session now fully deletes the sandbox via `deleteSandbox` instead of just stopping it (matching design sessions and projects behavior)

## Full Walkthrough Evidence Capture (Screenshots + Video) - 2026-02-27

- **Why**: Static screenshots alone don't show the full context of UI state before/after a fix. Video recordings provide a richer walkthrough that makes it easier for reviewers to verify the fix actually works, especially for interactive flows (animations, transitions, hover states).

- **Changes**:
  1. **Dockerfile**: Added `agent-browser install` to ensure Chromium binary is available (previously only Playwright's Chromium was installed, agent-browser might not find it)
  2. **Task prompt** (`taskWorkflow.ts`): Rewrote evidence section to capture both full-page screenshots (`--full`) and WebM video recordings (`record start/stop`) for before/after walkthroughs
  3. **Evidence collection** (`daytona.ts`): Added video (.webm) targets alongside screenshot (.png) targets. Each stage (before_fix/after_fix) now collects both formats
  4. **Proof dedup** (`taskProof.ts`): Updated deduplication to also check `fileType`, so a screenshot and video for the same stage coexist without one deleting the other
  5. **UI labels** (`TaskDetailModal.tsx`): Video proofs now show "Before Walkthrough" / "After Walkthrough" labels distinct from screenshot labels

- **Impact**: Task evidence now includes video walkthroughs alongside screenshots, giving reviewers a complete picture of before/after state

## Improve Screenshot Evidence Diagnostics - 2026-02-27

- **Why**: When screenshots weren't captured, users had no visible explanation why. Warnings were buried in run logs that users rarely expanded, making it frustrating when proof of completion was missing.

- **Changes**:
  1. **Enhanced evidence collection diagnostics** (`packages/backend/convex/daytona.ts:830-898`):
     - After checking for missing screenshot files, parse the activity log to detect if agent-browser commands were attempted
     - Provide contextual diagnostic messages:
       - No agent-browser commands found → "Agent did not attempt to capture screenshots (likely backend-only changes or could not infer the route to test)"
       - Agent-browser commands found but files missing → "Agent attempted to capture screenshots but files were not created (check run logs for dev server or agent-browser errors)"
       - Activity log unavailable → "Could not determine why screenshots are missing (activity log unavailable)"
  2. **Prominent warning display in UI** (`apps/web/lib/components/tasks/TaskDetailModal.tsx:155-165, 698-717`):
     - Extract evidence warnings from latest successful run's logs
     - Display warnings prominently in Proof of Completion section with warning icon and styled box
     - Users no longer need to dig through run logs to understand why screenshots are missing

- **Impact**:
  - Users immediately see why screenshots weren't captured without expanding logs
  - Clear distinction between "agent chose not to capture" vs "agent tried but failed"
  - Better debugging experience for screenshot capture issues

## Fix Task Evidence Streaming Break and Screenshot Prompt - 2026-02-27

- **Why**: Adding `Skill` to `allowedTools` broke Claude CLI streaming (no stdout/activity logs), and the prompt incorrectly instructed Claude to use the `Skill` tool for screenshots instead of direct Bash commands to invoke `agent-browser`, which doesn't exist in the target repo's sandbox. Additionally, the prompt said "Do NOT run dev commands" but screenshots require starting a dev server.

- **Changes**:
  1. **Removed `Skill` from `allowedTools`** (`packages/backend/convex/taskWorkflow.ts:177`):
     - `Skill` is not a valid CLI tool argument and was causing streaming to fail
     - `agent-browser` is installed globally in Docker image and can be invoked directly via Bash
  2. **Rewrote screenshot section in task prompt** (`packages/backend/convex/taskWorkflow.ts:61-107`):
     - Replaced `Skill` tool references with direct Bash command instructions: `agent-browser open/screenshot/close`
     - Added detailed before/after workflow with dev server lifecycle (start in background, wait, capture, kill)
     - Changed contradictory rule from "Do NOT run dev commands" to "You MAY run the dev server ONLY for screenshot capture (kill it after)"
     - Made screenshots truly optional with clear skip conditions (backend-only changes, route inference failure, dev server failure)

- **Impact**:
  - Task execution streaming will now work correctly in real-time
  - Screenshots can actually be captured when UI changes are made
  - Claude agent won't get confused by contradictory instructions

## Automated Before/After Task Evidence Capture - 2026-02-27

- **Why**: Task outcomes lacked consistent visual proof tied to the specific run, which made business/code review slower and less trustworthy when validating UI bug fixes.

- **Changes**:
  1. **Task workflow evidence contract**:
     - Updated task implementation prompt to require `agent-browser` before/after screenshots with deterministic run-scoped paths.
     - Enabled `Skill` in allowed tools for task execution runs.
  2. **Non-blocking evidence collection**:
     - Added a Daytona internal action that reads expected screenshot files from sandbox, stores them in Convex Storage, and records warnings/missing stages without failing execution.
     - Wired this into task execution workflow so evidence capture runs before completion and writes warning logs on partial/missing capture.
  3. **Proof metadata + dedupe**:
     - Extended `taskProof` schema with optional `runId`, `evidenceStage`, and `source` fields.
     - Added internal automated-proof mutation with dedupe per `taskId + runId + evidenceStage`.
     - Kept manual proof uploads intact and explicitly tagged as manual.
  4. **Task detail evidence UX**:
     - Updated proof rendering in `TaskDetailModal` to show stage badges (`Before Fix`, `After Fix`, `Manual`) and run timestamp labels while preserving full history.

## Archived Sessions Visible in Sidebar - 2026-02-26

- **Why**: Archived sessions disappeared completely from the UI with no way to view their history. Users need to reference past work without accidentally modifying it.

- **Changes**:
  1. **Backend**: Added `listArchived` queries to both `sessions.ts` and `designSessions.ts` to return only archived sessions for a repo.
  2. **Sidebars**: Added collapsible "Archived" section to `SessionsSidebar` and `DesignSessionsSidebar` with a chevron toggle. Archived items show as dimmed links with no action dropdown. Search filters both active and archived sessions.
  3. **Read-only mode**: When viewing an archived session, all action buttons (sandbox toggle, clear chat, send for review, summary, prompt input) are hidden. An "Archived" banner replaces the action bar. Design sessions also hide the "Use this design" button and sandbox start button.

## Faster Sandbox Start for Existing Sandboxes - 2026-02-26

- **Why**: Clicking "Start" on a session showed the sandbox as started ~5 seconds late. Daytona had the sandbox running almost immediately, but the UI waited for git sync, branch checkout, and service startup to complete before updating the session status to "active".

- **Changes**:
  1. **Early `sandboxReady` for existing sandboxes** (`packages/backend/convex/daytona.ts`):
     - For reused sandboxes, `sandboxReady` is called right after health check passes, before git sync/checkout
     - Git sync and branch checkout still happen, just after the UI is already updated
  2. **Race condition guards** (`packages/backend/convex/sessions.ts`, `packages/backend/convex/designSessions.ts`):
     - `sandboxReady` now skips if session was stopped (`"closed"`) while start was in flight
     - `sandboxError` now resets status back to `"closed"` on failure

- **Impact**:
  - Existing sandbox restarts appear active in UI as soon as health check passes (~1s) vs previous 5s+ wait

## Reuse Stopped Session Sandboxes on Restart - 2026-02-26

- **Why**: Stopping a session sandbox always led to creation of a new sandbox on next start, which broke expected stop/resume behavior and made lifecycle feel unreliable.

- **Changes**:
  1. **Reconnect behavior now starts stopped sandboxes** (`packages/backend/convex/daytona.ts`):
     - Added `ensureSandboxRunning(...)` that first probes sandbox health and starts the sandbox when needed
     - Applied this to session reconnect paths so stopped sandboxes are resumed instead of treated as dead
  2. **Session stop now stops instead of deletes** (`packages/backend/convex/sessions.ts`, `packages/backend/convex/daytona.ts`):
     - Session `stopSandbox` now schedules a sandbox stop action and preserves `sandboxId` on the session record
     - `ptySessionId` is cleared on stop to avoid stale terminal handles
  3. **Race guard for quick stop/start toggles** (`packages/backend/convex/daytona.ts`):
     - Added session-status and sandbox-id validation in `internal.daytona.stopSandbox` so delayed stop jobs no-op if the session has already restarted

- **Impact**:
  - Stopping and restarting a session now reuses the same sandbox when available
  - Session restarts are faster and do not unnecessarily create fresh sandboxes

## Add Clear Chat Button to Sessions and Design Pages - 2026-02-26

- **Why**: Users needed a way to reset conversation history and remove generated designs to start fresh within a session without archiving it.

- **Changes**:
  1. **Session chat clearing** (`packages/backend/convex/sessions.ts`):
     - Added `clearMessages` mutation to clear all messages, plan content, and summary from a session
  2. **Design session clearing** (`packages/backend/convex/designSessions.ts`):
     - Added `clearMessages` mutation to clear all messages and reset selected variation index for design sessions
  3. **UI implementation**:
     - Added clear chat button with trash icon in `ChatPanel.tsx` header (sessions page)
     - Added clear chat button with trash icon in `DesignDetailClient.tsx` header (design page)
     - Both include confirmation dialogs that warn about the action being irreversible

- **Impact**:
  - Users can now clear chat history mid-session without archiving
  - Buttons are disabled when no messages exist
  - Works consistently across both session and design workflows

## Persist Session Claude Context Across Recreated Sandboxes - 2026-02-26

- **Why**: Session conversations lost Claude’s local thread state whenever a sandbox was recreated, forcing fresh context and reducing continuity even when the app session itself was unchanged.

- **Changes**:
  1. **Deterministic session persistence identity** (`packages/backend/convex/daytona.ts`):
     - Added deterministic session hashing helpers to derive a stable Daytona volume name and Claude `--session-id` per app session
  2. **Daytona volume mount for Claude state** (`packages/backend/convex/daytona.ts`):
     - Added session-scoped volume provisioning and mounted it at `/home/daytona/.claude`
     - Threaded optional volume mounts through sandbox creation helpers and into `setupAndExecute`
     - Applied the same session volume mount when `startSessionSandbox` creates a replacement sandbox
  3. **Claude resume wiring + safe fallback** (`packages/backend/convex/daytona.ts`):
     - Passed deterministic `CLAUDE_SESSION_ID` into callback runs so Claude resumes the same thread across sandbox lifecycles
     - Added one retry without saved session ID when an attempt fails before any tool activity
  4. **Session-only workflow integration**:
     - `packages/backend/convex/sessionWorkflow.ts`: pass `sessionPersistenceId` into `setupAndExecute`
     - `packages/backend/convex/summarizeWorkflow.ts`: pass `sessionPersistenceId` into `setupAndExecute`
     - `packages/backend/convex/daytona.ts` (`runSessionAudit`): audits now use the same deterministic Claude session ID

- **Impact**:
  - `sessions/[id]` flows now preserve Claude conversational continuity across recreated sandboxes
  - Ask/Plan/Execute/Summary/Audit runs within a session share the same persisted Claude thread identity
  - Other workflow families remain unchanged

## Refine Quick Task Selection Action Bar Layout - 2026-02-25

- **Why**: Selection controls were split between header and bottom action area, which made the flow feel disjointed while selecting tasks.

- **Changes**:
  1. **Unified bottom action controls** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Moved `Cancel` into the bottom action bar next to `Actions`
     - Wrapped both buttons in a shared bordered/background container
  2. **Dialog footer simplification** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Removed `Exit Selection` from the actions dialog footer

- **Impact**:
  - Selection actions are now grouped in one place at the bottom of the page
  - The actions dialog focuses only on task actions, not selection-mode controls

## Add Bottom Actions Dialog for Quick Task Selection - 2026-02-25

- **Why**: Selection actions in Quick Tasks lived only in the top header, which is less ergonomic when users are actively selecting items in long lists/boards.

- **Changes**:
  1. **Bottom selection action trigger** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Added a bottom, floating `Actions` button that appears during select mode
     - Button is disabled until at least one task is selected and shows selected count
  2. **Dialog-based actions menu** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Added an actions dialog opened by the bottom button
     - Moved grouping action into the dialog (`Group into Project`)
     - Added explicit `Close` and `Exit Selection` actions

- **Impact**:
  - Selection workflows now have an action entrypoint near the bottom interaction area
  - Grouping selected quick tasks is available from a dedicated actions menu dialog

## Refresh Git Auth on Reused Session Sandboxes - 2026-02-25

- **Why**: Session sandboxes that were reused from `existingSandboxId` skipped repo sync and credential refresh, so `origin` could still contain an expired GitHub App installation token and `git push` from the VS Code panel failed with authentication errors.

- **Changes**:
  1. **Session reconnect git refresh** (`packages/backend/convex/daytona.ts`):
     - Reused-session path in `startSessionSandbox` now calls `syncRepo(...)` before starting services, which refreshes `origin` auth using a fresh installation token
  2. **Branch consistency on reconnect** (`packages/backend/convex/daytona.ts`):
     - Added `checkoutSessionBranch(...)` and invoked it in the reused-session path so the sandbox is on the expected session branch after reconnect

- **Impact**:
  - Reopening an existing session sandbox now refreshes GitHub auth before terminal/editor usage
  - `git push` from the session IDE/terminal no longer depends on stale token state from older sandbox runs

## Auto-scroll Activity Steps to Latest Entry - 2026-02-25

- **Why**: The activity timeline could open at the top and force manual scrolling to see the newest events, which slows down monitoring during and after agent execution.

- **Changes**:
  1. **Bottom-on-open behavior** (`packages/ui/src/ai-elements/activity-steps.tsx`):
     - Added a scroll container ref and effect that jumps to the latest step whenever the activity panel is opened
  2. **Continuous follow behavior** (`packages/ui/src/ai-elements/activity-steps.tsx`):
     - Reused the same effect to keep the viewport pinned to the bottom as step count increases

- **Impact**:
  - Opening Activity Steps now starts at the newest entries
  - Live step updates stay visible without manual scroll intervention

## Use users.lastSeenAt for Active User Metrics - 2026-02-25

- **Why**: Active user counting was based on session message/activity timestamps, which can misrepresent online presence and diverge from the platform's explicit presence heartbeat model.

- **Changes**:
  1. **Active users source of truth** (`packages/backend/convex/analytics.ts`):
     - Updated `getActiveUsers` to read `users.lastSeenAt` instead of session messages
     - Scoped to users who currently have active sessions for the repo
  2. **Timeline consistency** (`packages/backend/convex/analytics.ts`):
     - Updated timeline `activeUsers` buckets to derive from `users.lastSeenAt` for users with active repo sessions

- **Impact**:
  - "Cookers Now" now reflects heartbeat-based online presence from the users table
  - Repo card sparkline and headline metric use the same active-user definition

## Fix Active Users Metric to Use Session Activity - 2026-02-25

- **Why**: "Cookers Now" could show `0` even while users had open active sessions because the metric only counted user-authored chat messages within the last 5 minutes.

- **Changes**:
  1. **Active user calculation update** (`packages/backend/convex/analytics.ts`):
     - `getActiveUsers` now uses last session activity timestamp (`updatedAt` with message-time fallback) instead of requiring a recent user-role message
     - Keeps the 5-minute recency window while better matching real active usage

- **Impact**:
  - The metric now reflects users with recently active sessions, not just users who typed a message in that window

## Add Sparkline Trends to Repo Home Stat Cards - 2026-02-25

- **Why**: Point-in-time values on the repo home cards lacked context, making it hard to quickly see whether each metric was improving or flattening within the selected filter window.

- **Changes**:
  1. **Extended activity timeline payload** (`packages/backend/convex/analytics.ts`):
     - Added per-bucket `tasksCompleted`, `sessionsWithPr`, and `activeUsers`
     - Preserved existing fields while enriching timeline buckets for card-level trend rendering
  2. **Repo home chart wiring** (`apps/web/app/(main)/[repo]/RepoHomeClient.tsx`):
     - Added compact sparkline renderer and placed it on the right side of each stat card
     - Added range-aware timeline window + bucket sizing from `statsRange`
     - Mapped card trends to meaningful series:
       - PRs Shipped -> `prsShipped`
       - Cook Rate -> `sessionsWithPr / sessions`
       - Cookers Now -> `activeUsers`
       - Tasks Done -> `tasksCompleted`

- **Impact**:
  - Each card now shows quick visual momentum instead of only a static number
  - Trend lines stay synchronized with the same dropdown filter used by the headline stats

## Add Upload PRD Modal with Paste + File Options - 2026-02-25

- **Why**: Uploading PRDs forced users straight into file picker flow, which blocked quick copy-paste workflows when requirements already exist as text.

- **Changes**:
  1. **Upload entrypoint changed** (`apps/web/lib/components/sidebar/DocsSidebar.tsx`):
     - "Upload PRD" now opens a dialog instead of immediately triggering file selection
  2. **Dual-input modal flow** (`apps/web/lib/components/sidebar/DocsSidebar.tsx`):
     - Added file upload action inside the dialog (still supports `.md` and `.txt`)
     - Added paste textarea with an explicit "Upload from paste" action
  3. **Shared creation pipeline** (`apps/web/lib/components/sidebar/DocsSidebar.tsx`):
     - Consolidated file and paste flows into one helper that creates the doc and starts PRD parsing

- **Impact**:
  - Users can upload via file or paste without leaving the same modal
  - Existing backend PRD parse behavior remains consistent across both input paths

## Add Time-Range Filters to Repo Home Stats - 2026-02-25

- **Why**: Repo home stats were fixed to all-time numbers, which made it hard to inspect short-term performance changes or compare recent execution windows.

- **Changes**:
  1. **URL-backed filter state** (apps/web/lib/search-params.ts):
     - Added repoStatsRangeParser with values: 1d, 3d, 1w, 1m, 3m, 6m, 1y, all
     - Uses nuqs replace-history behavior to keep range changes shareable via URL
  2. **Repo home filter UI + query wiring** (apps/web/app/(main)/[repo]/RepoHomeClient.tsx):
     - Added top-right dropdown range control inside the Eva stats card header
     - Added range-to-timestamp mapping using dayjs
     - Passed computed startTime into api.analytics.getImpactStats

- **Impact**:
  - Users can now switch Eva metrics between short and long windows without leaving /[repo]
  - Selected range persists in the URL (statsRange) for refresh/share consistency

## Stop Button + Inline Edit in TaskDetailModal - 2026-02-25

- **Why**: Quick tasks had no way to stop execution once started (users had to wait for completion or failure), and title/description were read-only despite the update mutation already supporting both fields. This created frustration when tasks needed cancellation or quick edits during execution.

- **Changes**:
  1. **Backend** (`packages/backend/convex/taskWorkflow.ts`):
     - Added `cancelExecution` authMutation following the design sessions pattern
     - Verifies ownership via `board.ownerId === ctx.userId`
     - Cancels active workflow with try/catch (workflow may already be done)
     - Finds active run via `by_task` index, patches to error status with "Cancelled by user"
     - Clears streaming activity for the task entity
     - Resets task to `{ status: "todo", activeWorkflowId: undefined }`
  2. **Frontend** (`apps/web/lib/components/tasks/TaskDetailModal.tsx`):
     - Added `IconPlayerStop` import and `cancelExecution` mutation
     - Added state: `isStopping`, `isEditingTitle`, `editTitle`, `isEditingDescription`, `editDescription`
     - **Stop button**: Replaces "Run Eva" when `hasActiveRun` is true, red destructive variant, disabled when not owner or stopping
     - **Title inline edit**: Click to edit (disabled when `hasActiveRun`), save on blur/Enter, cancel on Escape, any team member can edit
     - **Description inline edit**: Click to edit (disabled when `hasActiveRun`), save on blur/Ctrl+Enter, cancel on Escape, includes "Click to add description..." placeholder when empty, any team member can edit, preserves full description including element details separator

- **Impact**:
  - Users can now immediately stop tasks that are stuck or running incorrectly without waiting
  - Quick edits to title/description no longer require navigating away from the detail modal
  - Both features respect task execution state (disabled when running) to prevent conflicts

## Simplify daytona.ts — 2026-02-25

- **Why**: The 1137-line file had repeated patterns - verbose `executeCommand` calls used 20+ times, identical sandbox context resolution in 3 places, duplicated service-start commands. Reduced by 181 lines while improving readability and maintainability.

- **Changes**:
  1. **Added `exec` helper** (line 19) - Wraps `sandbox.process.executeCommand` with simpler signature, returns result string directly instead of response object
  2. **Added `resolveSandboxContext` helper** (line 47) - Combines API key resolution, Daytona client creation, infra env vars, and snapshot lookup. Replaced identical 12-line blocks in `setupAndExecute`, `startSessionSandbox`, and `startDesignSandbox`
  3. **Added `startSessionServices` helper** (line 808) - Starts pnpm dev + code-server in one call. Deduplicates service-start commands in `startSessionSandbox` (reuse path + new sandbox path)
  4. **Replaced all `executeCommand` calls with `exec`** - 20+ call sites simplified from 5-line verbose calls to 1-line `exec` calls
  5. **Collapsed `setupAndExecute` ephemeral/non-ephemeral branches** - Both paths called similar functions with different args. Unified to conditional expression using `?:` operator
  6. **Simplified `startDesignSandbox` if/else** - Pulled common `setupBranch` call outside the conditional, eliminated duplication
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.

- **Result**: File reduced from 1137 to 956 lines (181 lines removed). No exported signatures changed. All type checks pass.

## Import from Linear to Quick Tasks — 2026-02-25

- **Why**: Quick tasks could only be created one-at-a-time through manual UI input. Teams managing backlogs in Linear needed a way to bulk-import issues as quick tasks without copy-pasting each title/description individually. Bulk import enables fast bootstrapping of conductor task boards from existing Linear workflows.

- **Changes**:
  1. **New Convex Node.js action** (`packages/backend/convex/linearActions.ts`):
     - `fetchIssues` action accepts repo ID and array of Linear identifiers (e.g., `TEAM-123`)
     - Resolves `LINEAR_API_KEY` from team/repo env vars via `resolveEnvVars()`
     - Batches all issue fetches into single Linear GraphQL request using aliased queries (`issue0: issue(id: "TEAM-1") { ... }`)
     - Returns array of `{ identifier, title, description }` with runtime type checks (no `as` casts)
     - Silently skips not-found issues (Linear API returns `null` for inaccessible/deleted issues)
     - Uses manual `ctx.auth.getUserIdentity()` auth (authAction doesn't work with `"use node"` directive)
  2. **Batch mutation** (`packages/backend/convex/agentTasks.ts`):
     - Added `createQuickTasksBatch` mutation accepting `{ repoId, tasks: Array<{ title, description? }>, baseBranch }`
     - Reuses board/column auto-creation logic from `createQuickTask`
     - Creates all tasks in single transaction with atomic ordering (single mutation = no N round-trips)
     - Returns array of task IDs
  3. **Import modal** (`apps/web/lib/components/quick-tasks/ImportLinearModal.tsx`):
     - Textarea accepts Linear URLs (`https://linear.app/team/issue/TEAM-123/...`) or raw identifiers (`TEAM-123`)
     - `parseLinearIdentifiers()` helper extracts identifiers via regex, deduplicates via Set
     - Live count shown below textarea: "3 issues detected: TEAM-1, TEAM-2, TEAM-3"
     - BranchSelect for shared base branch (single branch for all imports)
     - Task titles prefixed with identifier for traceability: `"TEAM-123: Issue Title"`
     - Error handling: inline red box with descriptive message (missing API key, no issues found, Linear API failure)
     - Submit button dynamically shows count: "Import 3 Issues"
  4. **UI wiring** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Added "Import from Linear" button (secondary variant, `IconFileImport` icon) before "New Task" button
     - Added `isImporting` state and `<ImportLinearModal>` render

- **Impact**:
  - **UX**: Teams can paste 10+ Linear URLs and bulk-create tasks in seconds vs. manual entry
  - **Traceability**: Task titles include Linear identifier for easy cross-reference
  - **Performance**: Single GraphQL request + single Convex mutation (not N\*2 round-trips)
  - **Error tolerance**: Silently skips not-found/inaccessible issues instead of failing entire import
  - **Security**: LINEAR_API_KEY stored in team/repo env vars (not hardcoded)

## Move GitHub Token Generation Server-Side — 2026-02-25

- **Why**: GitHub App installation tokens have a 1-hour TTL. Previously, tokens were generated in the frontend via `getWorkflowTokens()`, passed through Convex mutations, workflow args, and into daytona sandbox as env vars. By the time Claude CLI tried to `git push`, tokens could be expired (especially for long-running tasks). Additionally, tokens passed through the frontend created unnecessary security exposure. Moving token generation server-side eliminates TTL races and improves security by keeping tokens internal to backend infrastructure.

- **Changes**:
  1. **New centralized auth module**: Created `packages/backend/convex/githubAuth.ts` with shared functions: `normalizePemKey()`, `getGitHubCredentials()`, `getInstallationToken()`, `getInstallationOctokit()`
  2. **Backend auth consolidation**: Updated `github.ts` and `snapshotActions.ts` to import shared auth functions, eliminating ~150 lines of duplicated key normalization and credential management code
  3. **Fresh token generation at use time**: Modified internal helpers in `daytona.ts` to accept `installationId` instead of `githubToken`:
     - `createSandbox()` now generates fresh token internally and sets `INSTALLATION_ID` env var for callback refresh
     - `syncRepo()`, `cloneAndSetupRepo()` generate fresh tokens for git operations
  4. **Callback script token refresh**: Updated `buildCallbackScript()` to refresh `GITHUB_TOKEN` env var before spawning Claude CLI by calling `github:getInstallationTokenAction` via Convex HTTP API
  5. **Workflow migrations**: Updated all 11 workflow files (task, session, design, build, research query, test gen, summarize, project interview, evaluation, doc PRD, doc interview) to accept `installationId` instead of `githubToken` in workflow args
  6. **Frontend simplification**: Renamed `getWorkflowTokens()` → `getConvexToken()` in server action; removed GitHub token generation entirely. Updated 15 components across pages and lib to pass `installationId` from repo data instead of requesting tokens

- **Impact**:
  - **Eliminates TTL races**: Tokens are generated immediately before use, preventing expiration during long task execution
  - **Security**: Tokens no longer pass through frontend; kept internal to backend infrastructure
  - **Audit trail**: `INSTALLATION_ID` env var in sandbox enables callback script to refresh tokens autonomously
  - **Code consolidation**: Removed 150+ lines of duplicated auth code; single source of truth in `githubAuth.ts`
  - **No breaking changes**: All mutations and workflows still work end-to-end; token management is now transparent to callers

## Persist Agent Run Activity Logs — 2026-02-25

- **Why**: During task execution, detailed streaming activity (file reads, edits, bash commands, thinking steps) was shown via `streamingActivity` table. On completion, the streaming row was deleted and the `activityLog` string (passed through the workflow event) was silently dropped — never saved. Result: after success/error, users only saw a status badge + PR link. All step-by-step detail was lost, making it impossible to audit what the agent did after the run completed.

- **Changes**:
  1. **Schema**: Added `activityLog: v.optional(v.string())` to `agentRuns` table in `schema.ts` to persist the activity log after completion
  2. **Validator**: Added `activityLog: v.optional(v.string())` to `agentRunValidator` in `agentRuns.ts` so queries return the persisted field
  3. **Workflow**: Updated `completeRun` mutation in `taskWorkflow.ts` to:
     - Accept `activityLog: v.union(v.string(), v.null())` in args
     - Save `activityLog` when patching the run document
     - Pass `result.activityLog` from workflow step 7 to `completeRun`
  4. **Alternative path**: Updated `agentRuns.complete` mutation to accept and save `activityLog` for manual run completion
  5. **Frontend**: Updated `TaskDetailModal.tsx` and `ProjectTaskDetailPanel.tsx` to render persisted activity log as static `ActivitySteps` component when run is completed/errored

- **Impact**:
  - **Auditability**: Full step-by-step activity logs are now preserved after run completion, enabling post-mortem debugging and compliance tracking
  - **User experience**: Users can expand completed runs and see exactly what the agent did (file changes, commands run, thinking process)
  - **No breaking changes**: New optional field, backward compatible with existing runs

## Consolidate Env Var Resolution into Shared Helper — 2026-02-25

- **Why**: After BYOK implementation, env var resolution (team + repo → decrypt → merge) was duplicated across `daytona.ts`, `snapshotActions.ts`, and `mcpRoutes.ts` with subtle bugs and inefficiencies. Each copy had different issues: `snapshotActions.ts:rebuildSnapshot` only checked repo env vars (skipped team entirely), `snapshotActions.ts:deleteDaytonaSnapshot` had flipped precedence (team overrode repo instead of repo overriding team), and sandbox operations in `daytona.ts` resolved env vars twice (4 queries instead of 2). Consolidating into a shared helper eliminates duplication, fixes bugs, and improves performance.

- **Changes**:
  1. **New shared helpers in `envVarResolver.ts`**:
     - `resolveEnvVars(ctx, repoId)`: Generic helper that fetches team + repo env vars, decrypts, and merges with correct precedence (repo overrides team)
     - `resolveDaytonaApiKey(ctx, repoId)`: Daytona-specific helper that calls `resolveEnvVars`, extracts and validates `DAYTONA_API_KEY` (throws if missing), returns both API key and sandbox env vars (with key stripped)

  2. **Updated `daytona.ts`**:
     - Removed `resolveTeamEnvVars` and `resolveDaytonaApiKey` functions (replaced by shared helpers)
     - Updated 9 functions to use `resolveDaytonaApiKey`: `runSandboxCommand`, `getPreviewUrl`, `setupAndExecute`, `launchOnExistingSandbox`, `launchAudit`, `runSessionAudit`, `deleteSandbox`, `startSessionSandbox`, `startDesignSandbox`
     - Eliminated double-resolution in sandbox operations (4 queries → 2)

  3. **Updated `snapshotActions.ts`**:
     - Removed `requireEnv` function (no longer used)
     - Updated `getGithubPat` to take decrypted merged vars instead of raw encrypted array
     - Fixed `rebuildSnapshot` and `pollWorkflowRun` to check both team AND repo env vars for `SNAPSHOT_GITHUB_PAT` (was only checking repo before)
     - Fixed `deleteDaytonaSnapshot` to use correct precedence (repo overrides team, was flipped before)

  4. **Updated `mcpRoutes.ts`**:
     - Simplified `getDecryptedRepoEnvVars` to use `resolveEnvVars` (reduced from ~30 lines to ~5 lines)

- **Impact**:
  - **DRY**: Single source of truth for env var resolution eliminates 9 duplicate error-handling blocks
  - **Performance**: Sandbox operations now make 2 queries instead of 4 (eliminated double-resolution)
  - **Bug fixes**: Snapshot operations now correctly check team-level env vars (fixes "env var not defined" when `SNAPSHOT_GITHUB_PAT` is set at team level)
  - **Consistency**: All env var resolution follows same precedence rules (repo overrides team)
  - **Maintainability**: Future changes to env var resolution only need to touch one file

## BYOK: Move DAYTONA_API_KEY and CONVEX_DEPLOY_KEY to User Env Vars — 2026-02-25

- **Why**: Platform was using its own `DAYTONA_API_KEY` and `CONVEX_DEPLOY_KEY` from process.env for all users, creating a single point of failure and preventing users from bringing their own infrastructure keys. Users should control their own Daytona and Convex deployment credentials via team/repo environment variables (BYOK - Bring Your Own Key). Platform infrastructure keys (CLERK_SECRET_KEY, NEXT_PUBLIC_CONVEX_URL) remain as platform env vars since they connect sandboxes back to the platform.

- **Changes**:
  1. **CONVEX_DEPLOY_KEY → BYOK (trivial)**:
     - Removed `extraEnvVarNames: ["CONVEX_DEPLOY_KEY"]` from `researchQueryWorkflow.ts:213`
     - Removed entire `extraEnvVarNames` mechanism from `daytona.ts` (parameter + loop that read from platform process.env)
     - User now sets `CONVEX_DEPLOY_KEY` in team/repo env vars, flows through via `mergedEnvVars` spread

  2. **DAYTONA_API_KEY → BYOK (medium)**:
     - Changed `getDaytona()` → `getDaytona(apiKey: string)` in both `daytona.ts` and `snapshotActions.ts`
     - Added `resolveDaytonaApiKey(ctx, repoId)` helper in `daytona.ts` to fetch/decrypt key from team/repo env vars (throws if missing)
     - Strip `DAYTONA_API_KEY` from `mergedEnvVars` before injecting into sandbox (sandbox doesn't need it)
     - Updated all Daytona action call sites (15 functions across 11 files) to resolve and pass API key:
       - **Already had repoId**: `setupAndExecute`, `startSessionSandbox`, `startDesignSandbox`
       - **Added repoId param**: `runSandboxCommand`, `getPreviewUrl`, `launchOnExistingSandbox`, `launchAudit`, `deleteSandbox`, `deleteDaytonaSnapshot`
       - **Internal repoId lookup**: `runSessionAudit` (queries session to get repoId)
     - Updated workflow callers (7 files): `sessionWorkflow.ts`, `taskWorkflow.ts`, `designWorkflow.ts`, `designSessions.ts`, `sessions.ts`, `projects.ts`, `repoSnapshots.ts`
     - Updated frontend callers (3 files): `DesignDetailClient.tsx`, `EditorPanel.tsx`, `SandboxPanel.tsx` (pass repoId to `getPreviewUrl` action)

  3. **SetupBanner enhancements**:
     - Check both team AND repo env vars (not just team)
     - Check for all required keys: `CLAUDE_CODE_OAUTH_TOKEN`, `DAYTONA_API_KEY`, `CONVEX_DEPLOY_KEY`
     - List ALL missing keys in modal (not just one)
     - Renamed dialog title: "Setup Required" (was "OAuth Setup Required")

- **Impact**:
  - **BYOK enforcement**: Users must provide their own Daytona API key and Convex deploy key via team/repo env vars
  - **Better security**: Keys are per-team/repo instead of shared across all users
  - **Clear errors**: Missing keys throw descriptive errors instead of silently failing
  - **No platform key exposure**: Sandbox env vars no longer include DAYTONA_API_KEY (stripped before injection)
  - **Frontend type safety**: All `getPreviewUrl` calls include required `repoId` parameter

## Add Public Landing Page and Move Dashboard to /home — 2026-02-25

- **Why**: The root route (`/`) was directly showing the authenticated repos dashboard, requiring users to be signed in before seeing any content. This creates a poor first-time user experience and prevents unauthenticated users from learning about the platform before signing up.

- **Changes**:
  1. **Route restructure**: Moved repos dashboard from `/` to `/home` (moved `app/(main)/page.tsx` and `app/(main)/ReposClient.tsx` to `app/(main)/home/` directory)
  2. **New landing page**: Created public landing page at `/` with Clerk sign-in/sign-up buttons for unauthenticated users, auto-redirects to `/home` when signed in
  3. **Middleware update**: Added `/` to `isPublicRoute` matcher to allow unauthenticated access
  4. **ClerkProvider redirects**: Updated `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl` from `/` to `/home`
  5. **Internal navigation**: Updated all internal references from `/` to `/home` across:
     - `app/(main)/layout.tsx` - TopNavBar display condition
     - `lib/components/TopNavBar.tsx` - logo link and "Repositories" nav button
     - `lib/components/Sidebar.tsx` - mobile and desktop logo links
     - `app/(main)/setup/[id]/RepoSetupClient.tsx` - all redirect buttons after repo setup

- **Impact**:
  - **Better onboarding**: Unauthenticated users see a clean landing page with clear sign-in/sign-up options
  - **Consistent navigation**: All "home" links now point to `/home` (repos dashboard)
  - **Clean separation**: `/` is public, `/home` and repo routes require authentication
  - **Zero breaking changes**: TypeScript compilation passes, existing functionality preserved

## Complete Auth Custom Functions Migration + Schema Migration — 2026-02-24

- **Why**: Every query/mutation/action manually called `getCurrentUserId(ctx)` or `ctx.auth.getUserIdentity()` with 2-3 lines of boilerplate. ~110 functions used `getCurrentUserId`, ~45 used `getUserIdentity` directly. This created inconsistency, duplication, and weak auth gates (20+ mutations didn't actually enforce auth). Additionally, `boards.ownerId` and `taskComments.authorId` were `v.string()` storing Clerk subject IDs, inconsistent with the rest of the schema which uses `Id<"users">`.

- **Changes**:
  1. **Setup**: Installed `convex-helpers`, created `packages/backend/convex/functions.ts` with 6 custom function builders (`authQuery`, `authMutation`, `authAction`, `internalAuthQuery`, `internalAuthMutation`, `internalAuthAction`). Added `getUserIdFromIdentity` internalQuery to `auth.ts` for action support.
  2. **Schema Migration**: Changed `boards.ownerId` from `v.string()` to `v.id("users")`, changed `taskComments.authorId` from `v.string()` to `v.id("users")`. Added data migration `migrateBoardsAndCommentsToUserIds` in `migrations.ts` to convert existing Clerk IDs to user IDs.
  3. **Migrated 110+ functions across 50+ files**: All functions using `getCurrentUserId` pattern migrated to `authQuery`/`authMutation`. All board cluster files using `getUserIdentity` pattern migrated. All action files migrated to `authAction`.

- **Files migrated** (50+ files):
  - **Auth cluster**: `auth.ts` (8 functions - me, isCurrentUserAdmin, getTheme, setTheme, getToolbarVisible, setToolbarVisible)
  - **Board cluster**: `boards.ts` (7), `columns.ts` (5), `agentTasks.ts` (18), `agentRuns.ts` (7), `taskComments.ts` (3), `taskProof.ts` (4), `subtasks.ts` (6), `taskDependencies.ts` (7)
  - **Core operations**: `projects.ts` (17), `sessions.ts` (16), `docs.ts` (17), `users.ts` (1)
  - **Analytics & reporting**: `analytics.ts` (8), `evaluationReports.ts` (7), `sessionAudits.ts` (3)
  - **Research & design**: `researchQueries.ts` (8), `designSessions.ts` (12), `designPersonas.ts` (5), `savedQueries.ts` (5), `routines.ts` (5)
  - **Teams & repos**: `teams.ts` (5), `teamMembers.ts` (4), `teamEnvVars.ts` (2), `repoEnvVars.ts` (2), `repoSnapshots.ts` (6)
  - **Misc**: `annotations.ts` (3), `notifications.ts` (5), `presence.ts` (1)
  - **Workflows** (26 mutations across 12 files): `buildWorkflow.ts`, `taskWorkflow.ts`, `sessionWorkflow.ts`, `summarizeWorkflow.ts`, `designWorkflow.ts`, `docInterviewWorkflow.ts`, `docPrdWorkflow.ts`, `evaluationWorkflow.ts`, `testGenWorkflow.ts`, `projectInterviewWorkflow.ts`, `researchQueryWorkflow.ts`
  - **Mutations** (2 functions in 1 file): `githubRepos.ts` (2 - create, remove)

- **Pattern changes**:
  - Removed ~500 lines of `const userId = await getCurrentUserId(ctx)` boilerplate
  - Removed ~500 lines of `const identity = await ctx.auth.getUserIdentity()` boilerplate
  - Replaced all `identity.subject` comparisons with `ctx.userId`
  - Fixed 20+ weak auth mutations that only called `getCurrentUserId()` without checking result
  - Changed query behavior from returning empty/null on no auth to throwing (consistent with mutations)

- **Impact**:
  - **Consistency**: Single auth pattern across entire backend
  - **Type safety**: `ctx.userId` guaranteed to be `Id<"users">` in all handlers
  - **Security**: All functions now properly enforce authentication
  - **Maintainability**: Centralized auth logic in `functions.ts`
  - **Schema consistency**: All owner/author fields now use `Id<"users">` instead of strings
  - **Migration ready**: Data migration available for boards and comments
  - **Zero TypeScript errors**: Full compilation success

- **Not migrated** (by design):
  - `auth.ts`: `createOrMigrateUser`, `ensureUserExists` (they create users, can't require user to exist)
  - `notifications.ts`: `create` (called internally with explicit userId)
  - `streaming.ts`, `prosemirrorSync.ts`: No auth by design
  - `extensionReleases.ts`: Uses custom admin key auth
  - `sessions.ts`: `getOrCreateExtensionSession` (uses clerkId arg)
  - `presence.ts`: `list`, `disconnect` (use token-based auth)
  - **Node.js actions** (all files with `"use node"` directive): `daytona.ts`, `github.ts`, `repoEnvVarsActions.ts`, `teamEnvVarsActions.ts` - convex-helpers custom function wrappers don't work with Node.js actions, so these keep manual `getUserIdentity()` auth checks
  - Internal mutations/queries that don't check auth
  - Workflow definitions

## Migrate projects.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 17 functions (4 queries, 13 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. Five mutations had weak authentication - they called `getCurrentUserId()` but didn't throw when unauthenticated, allowing unauthenticated calls to proceed. The `startDevelopment` mutation used BOTH patterns (both `ctx.auth.getUserIdentity()` and `getCurrentUserId(ctx)`), creating redundancy.
- **Changes**: Replaced imports to add `{ authQuery, authMutation }` from `./functions`. Removed `import { mutation, query } from "./_generated/server"` and `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (13 occurrences). Removed dual auth pattern in `startDevelopment` (removed both `identity` and `userId` variable declarations). Removed all `if (!userId)` checks from queries (4 returning null/empty) and error throws from mutations (8 occurrences). Replaced all instances of `userId` variable with `ctx.userId` in project creation, message creation, task creation, and authorization checks (8 locations). Replaced `identity.subject` with `ctx.userId` in board creation within `startDevelopment`.
- **Functions migrated**: `list`, `get`, `getTaskCount`, `getTaskProgress` (4 authQuery) + `create`, `update`, `addMessage`, `remove`, `deleteCascade`, `clearMessages`, `startDevelopment`, `createFromTasks`, `updatePrUrl`, `updateProjectSandbox`, `clearProjectSandbox`, `updateLastSandboxActivity`, `updateLastConversationMessage` (13 authMutation).
- **Impact**: Consistent auth pattern across all project operations. Less boilerplate (removed ~40 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. Five weak auth mutations now properly enforce authentication: `updatePrUrl`, `updateProjectSandbox`, `clearProjectSandbox`, `updateLastSandboxActivity`, `updateLastConversationMessage`. The `startDevelopment` function simplified from dual auth pattern to single `ctx.userId` access. Queries now throw when unauthenticated instead of returning empty/null, matching mutation behavior. TypeScript compilation passes with only pre-existing downlevelIteration warning (unrelated to auth changes).

## Migrate sessions.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 16 public functions (2 queries, 14 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. Seven mutations had weak authentication - they called `getCurrentUserId()` but didn't check the result, allowing unauthenticated calls to proceed.
- **Changes**: Replaced imports to add `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"` and unused `query` import. Removed all `const userId = await getCurrentUserId(ctx)` calls (11 occurrences). Removed all `if (!userId)` checks from queries (2 returning null/empty) and error throws from mutations (5 occurrences). Replaced all instances of `userId` variable with `ctx.userId` in session creation, message creation, and authorization checks (6 locations).
- **Functions migrated**: `list`, `get` (2 authQuery) + `create`, `addMessage`, `updateStatus`, `update`, `updateSummary`, `archive`, `updateSandbox`, `clearSandbox`, `updatePtySession`, `updateFileDiffs`, `updatePlanContent`, `updateLastMessage`, `startSandbox`, `stopSandbox` (14 authMutation). Skipped 4 internal functions (`sandboxReady`, `sandboxError`, `getInternal`, `setPrUrl`) and `getOrCreateExtensionSession` (uses clerkId for auth) as requested.
- **Impact**: Consistent auth pattern across all session operations. Less boilerplate (removed ~40 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. Seven weak auth mutations now properly enforce authentication: `updateSummary`, `updateSandbox`, `clearSandbox`, `updatePtySession`, `updateFileDiffs`, `updatePlanContent`, `updateLastMessage`. The `list` query now throws when unauthenticated instead of returning empty array, matching mutation behavior. TypeScript compilation passes with no errors in this file.

## Migrate docs.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in all 17 functions (5 queries, 12 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. Four mutations (`addInterviewMessage`, `updateLastInterviewMessage`, `clearInterview`, `updateDocSandbox`) had weak authentication - they called `getCurrentUserId()` but didn't enforce authentication, allowing unauthenticated calls to proceed.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (17 occurrences). Removed all `if (!userId)` checks from queries (3 returning empty/null) and error throws from mutations (9 occurrences). In `addInterviewMessage`, replaced `userId: userId ?? undefined` with `userId: ctx.userId` to ensure userId is always set on interview messages.
- **Functions migrated**: `list`, `get`, `timelineStatus`, `timelineHistory` (4 authQuery) + `create`, `update`, `remove`, `startTestGen`, `completeTestGen`, `failTestGen`, `saveVersion`, `timelineUndo`, `timelineRedo`, `addInterviewMessage`, `updateLastInterviewMessage`, `clearInterview`, `updateDocSandbox` (13 authMutation). All 17 functions now enforce authentication.
- **Impact**: Consistent auth pattern across all doc operations. Less boilerplate (removed ~50 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. The 4 weak auth mutations now properly enforce authentication instead of silently accepting unauthenticated calls. The `list` and `get` queries now throw when unauthenticated instead of returning empty/null, matching mutation behavior. Interview messages now always have a userId attached. TypeScript compilation passes with no errors in this file.

## Migrate designSessions.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 12 functions (2 queries, 10 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. The `updateLastMessage` mutation had weak authentication (only called `getCurrentUserId()` without checking result), now enforced with `authMutation`.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (10 occurrences). Removed all `if (!userId)` null/empty checks from queries (1 occurrence) and error throws from mutations (8 occurrences). Replaced all instances of `userId` variable with `ctx.userId` in message creation, session creation, and authorization checks (3 locations).
- **Functions migrated**: `list`, `get` (queries) + `create`, `addMessage`, `updateLastMessage`, `selectVariation`, `startSandbox`, `stopSandbox`, `executeMessage`, `cancelExecution`, `archive` (mutations). Skipped 3 internal mutations (`updateSandbox`, `sandboxReady`, `sandboxError`) as they don't require user authentication.
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~30 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. The `updateLastMessage` mutation now properly enforces authentication instead of silently accepting unauthenticated calls. The `list` query now throws when unauthenticated instead of returning empty array, matching mutation behavior. TypeScript compilation passes with no errors in this file.

## Migrate presence.ts heartbeat to authMutation — 2026-02-24

- **Why**: The `heartbeat` function had weak authentication - it accepted `userId` as an argument but only used `getCurrentUserId()` for the `lastSeenAt` update without enforcing that the caller was authenticated. This allowed unauthenticated calls to register presence for any user. The migration to `authMutation` enforces authentication at the function level.
- **Changes**: Changed `heartbeat` from `mutation` to `authMutation`. Added validation to ensure the passed `userId` matches the authenticated `ctx.userId` (throws "Cannot send heartbeat for another user" if mismatch). Removed the `getCurrentUserId` import as it's no longer needed. The `userId` argument is kept in the function signature (required by `@convex-dev/presence` React hook), but now validated against the authenticated user.
- **Functions migrated**: Only `heartbeat` mutation. The `list` query and `disconnect` mutation remain unchanged as they have no auth by design - `list` uses room tokens for access control and `disconnect` uses session tokens.
- **Impact**: Heartbeat calls now require authentication. Users cannot send heartbeats for other users. The `lastSeenAt` update logic is simplified since `ctx.userId` is guaranteed to exist. Compatible with existing `@convex-dev/presence` React hook which passes userId as an argument.

## Migrate repoEnvVars.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 2 functions (`list` query and `removeVar` mutation). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ query, mutation }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed `const userId = await getCurrentUserId(ctx)` from both `list` and `removeVar`. Removed `if (!userId) return []` check from `list` query. Removed `if (!userId) throw new Error("Not authenticated")` from `removeVar` mutation.
- **Functions migrated**: `list` (query) and `removeVar` (mutation). Internal functions `getForSandbox` and `upsertVarInternal` remain unchanged as they use `internalQuery` and `internalMutation` which don't require auth checks.
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~6 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — `list` query that returned `[]` when unauthenticated now throws, matching mutation behavior. TypeScript compilation passes with no errors in this file.

## Migrate notifications.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 5 functions (3 queries, 2 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (5 occurrences). Removed all `if (!userId)` null/empty checks from queries (3 occurrences) and error throws from mutations (2 occurrences). Replaced 9 instances of `userId` variable with `ctx.userId` for notification ownership validation and database queries.
- **Functions migrated**: `list`, `get`, `countUnread` (queries) + `markAsRead`, `markAllAsRead` (mutations). Kept `create` and `createNotification` as plain mutation and helper function respectively (called internally by other modules).
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~15 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — queries that returned `[]`/`null`/`0` when unauthenticated now throw (matching mutation behavior). The `createNotification` helper function remains unchanged as it's used by `agentRuns.ts`, `agentTasks.ts`, `taskComments.ts`, and `taskWorkflow.ts` with explicit `userId` parameters.

## Migrate agentTasks.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getUserIdentity()` + `identity.subject` pattern in 18 functions (8 queries, 10 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"` — no longer needed since `ctx.userId` is guaranteed. Removed all `const identity = await ctx.auth.getUserIdentity()` blocks (18 occurrences removed). Removed all `if (!identity)` null/empty checks from queries and throw checks from mutations (18 occurrences). Replaced 20 instances of `identity.subject` with `ctx.userId` for board ownership validation and `ownerId` writes. Removed 2 redundant `await getCurrentUserId(ctx)` calls in `create` and `createQuickTask` — replaced with `ctx.userId` directly for `createdBy` field.
- **Functions migrated**: `listByBoard`, `listByColumn`, `listByProject`, `get`, `getActiveTasks`, `getAllTasks`, `getDependentTasks`, `getStatusesByIds` (8 queries) + `create`, `update`, `moveToColumn`, `updateOrder`, `updateStatus`, `remove`, `createQuickTask`, `startExecution`, `assignToProject`, `deleteCascade` (10 mutations).
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~60+ lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — queries that returned `[]` or `null` when unauthenticated now throw (matching mutation behavior). TypeScript compilation passes with no errors in this file.

## Migrate agentRuns.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getUserIdentity()` + `identity.subject` pattern in 6 functions (4 queries, 2 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed all `const identity = await ctx.auth.getUserIdentity()` blocks (11 lines removed across 6 functions). Removed all `if (!identity)` null/empty checks (6 occurrences). Replaced 7 instances of `identity.subject` with `ctx.userId` for board ownership validation.
- **Functions migrated**: `get`, `getWithDetails`, `listByTask`, `listAll` (queries) + `updateStatus`, `appendLog`, `complete` (mutations).
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~25 lines). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — auth failures now throw instead of returning null/empty, matching existing mutation behavior. TypeScript compilation passes with no errors in this file.

## Add Home Button + Restructure Admin Navigation — 2026-02-24

- **Why**: Navigation confusion between repo home (`/[repo]` with Eva's Stats) and root repos list (`/`). Logo takes users to root, but no way to return to repo home without manually editing URL. Additionally, Stats being hidden inside Settings sidebar made it less discoverable.
- **Home button in header**: Added Home icon button in sidebar header (next to collapse button) that links to `/[repo]` (Eva's Stats page). Only visible when in a repo context. Icon highlights in primary color when on home page, muted color otherwise. Includes tooltip "Home". Appears in both desktop and mobile layouts.
- **Admin navigation restructure**: Split admin features into two top-level items in ADMIN group: (1) Stats - direct link to `/[repo]/admin/stats` (no sidebar), (2) Settings - opens admin sidebar with Env Variables and Snapshots tabs. Changed icons: Stats uses `IconChartBar`, Settings uses `IconSettings`. Updated `CONTEXT_SIDEBAR_BY_NAV_NAME` to map "Settings" to "admin" context. Removed Stats from AdminSidebar component (now only Env Variables and Snapshots).
- **Impact**: Stats more discoverable as top-level nav item. Settings clearly represents configuration (env vars, snapshots). Home button accessible from header without cluttering navigation groups. Clean sidebar hierarchy: Logo → Root, Home button → Repo overview, ADMIN group → Stats (metrics) and Settings (config).

## Remove Team Slugs + Restore OAuth Setup Banner — 2026-02-24

- **Why**: Team slugs added unnecessary complexity without providing value. The `slugify` helper, `by_slug` index, `getBySlug` query, and slug uniqueness checks were all overhead for a feature that could be replaced with simple `team._id` URLs. Additionally, removing the old `SetupBanner` left users without feedback when the required `CLAUDE_CODE_OAUTH_TOKEN` was missing from their team env vars.
- **Schema changes**: Removed `slug: v.string()` field and `.index("by_slug", ["slug"])` from `teams` table. Teams now only have `name`, `createdBy`, `createdAt`, and optional `isPersonal` fields.
- **Backend cleanup**: Deleted `slugify()` helper function (15 lines) and entire `getBySlug` query (40 lines) from `teams.ts`. Removed slug generation, uniqueness validation, and slug field from `getOrCreatePersonal`, `create`, and `update` mutations. Updated return validators in `list` and `get` queries to remove `slug: v.string()`.
- **Frontend routing**: Renamed directory `apps/web/app/(main)/teams/[slug]/` to `[teamId]/`. Updated `page.tsx` params type from `{ slug: string }` to `{ teamId: string }`. Changed `TeamDetailClient` to accept `teamId` prop and use `api.teams.get` with `id: teamId as Id<"teams">` instead of `api.teams.getBySlug`.
- **Frontend links**: Updated all team links from `/teams/${team.slug}` to `/teams/${team._id}` in `TeamsClient.tsx` and `TeamEnvVarsClient.tsx`. Removed slug display (`/{team.slug}`) from team cards and removed "URL-friendly slug will be generated automatically" helper text from create dialog.
- **EnvVarsTable readOnly improvements**: Fixed bug where `readOnly` prop hid the entire Actions column including reveal/copy buttons. Now always renders the Actions column. Reveal and copy buttons are always shown (users need to see env var values). Edit and delete buttons are hidden when `readOnly={true}`. Added `onReveal` callback to `TeamEnvVarsClient` that calls `api.teamEnvVarsActions.revealValue` with team ID.
- **Restore SetupBanner**: Created new `SetupBanner.tsx` component that checks if team has `CLAUDE_CODE_OAUTH_TOKEN` set in `teamEnvVars`. Queries team and env vars, returns null if OAuth token exists or data is still loading. Shows modal dialog (not inline banner) with setup instructions and two actions: "Dismiss" (closes modal for session) or "Configure Team Settings" (navigates to `/teams/${team._id}`). Modal includes icon, clear messaging about required variable, and styled code display. Re-added `SetupBanner` import and render to `layout.tsx` before `{children}` inside `MainContent`.
- **Impact**: Teams now use simpler ID-based URLs. Slug-related complexity removed from codebase (0 references to `getBySlug`, `slugify`, or `team.slug` remain). Users can now view team env var values in read-only mode via reveal/copy buttons. OAuth setup feedback restored via banner that appears when entering repos without required token. Both `npx tsc` checks pass with no type errors.

## Env Vars Simplification + Personal Teams — 2026-02-24

- **Why**: Three env var tables (`systemEnvVars`, `teamEnvVars`, `repoEnvVars`) created confusion. `systemEnvVars` stored platform OAuth tokens globally without team isolation. Users wanted a Vercel-like model: every user has a Personal team, all repos belong to a team, OAuth tokens are team-scoped, and infrastructure vars come from `process.env` only.
- **Goal**: Simplify to 2 tables (`teamEnvVars` + `repoEnvVars`). Auto-create Personal team per user. Team-scoped OAuth. Infrastructure vars from `process.env` only.
- **Schema changes**: Added `isPersonal: v.optional(v.boolean())` to `teams` table. Deleted `systemEnvVars` table definition and `systemEnvVarCategoryValidator` from validators.
- **Personal team auto-creation**: Added `getOrCreatePersonal` internalMutation in `teams.ts` that queries for user's Personal team, creates one if missing (name: "Personal", slug: `personal-{suffix}`, `isPersonal: true`), adds owner membership, returns `teamId`. Added guard in `teams.remove` mutation to prevent deletion of Personal teams. Updated return validators in `list`, `get`, `getBySlug` to include `isPersonal` field.
- **Auto-assign repos to Personal team**: Added optional `teamId` arg to `githubRepos.upsert` internalMutation. On insert, sets `teamId` if provided. On update, patches `teamId` if provided and repo doesn't have one. Updated `githubRepos.create` mutation to query user's Personal team directly and set `teamId` on insert. Added `getUserByClerkId` internalQuery to `auth.ts` for use in `github.syncRepos`. Updated `github.syncRepos` action to call `getOrCreatePersonal` before installation loop, pass `personalTeamId` to every `githubRepos.upsert` call.
- **Rewrite daytona.ts env var resolution**: Replaced `resolveSystemEnvVars` (async, 50 lines, queried DB for OAuth tokens and infra vars) with pure function `resolveInfraEnvVars` (4 lines, reads `REQUIRED_INFRA_KEYS` from `process.env`). Simplified `createSandbox` signature from 7 params to 5 — removed `oauthToken` and `accountKey`, added `mergedEnvVars` (team + repo combined). OAuth token now flows through `mergedEnvVars` as `CLAUDE_CODE_OAUTH_TOKEN`. Removed all `ACCOUNT_KEY` references (concept deleted). Simplified `getOrCreateSandbox`, `setupAndExecute`, `startSessionSandbox`, `startDesignSandbox` to use new signature. Total removals: ~20 references to `accountKey`/`oauthAccountKey`/`ACCOUNT_KEY`.
- **Delete systemEnvVars backend**: Deleted `packages/backend/convex/systemEnvVars.ts` and `systemEnvVarsActions.ts`. Removed all `internal.systemEnvVars.*` imports from `daytona.ts`.
- **Frontend: Remove System tab**: Deleted `SystemEnvVarsClient.tsx`, `useSetupStatus.ts`, `SetupBanner.tsx`. Updated `EnvVariablesPageClient.tsx` to keep only Repo + Team tabs. Updated `TeamEnvVarsClient.tsx` to query `api.teamEnvVars.list` and render read-only `EnvVarsTable` (showing actual team env vars, not just a link). Added `readOnly?: boolean` prop to `EnvVarsTable.tsx` — when true, makes `onUpsert`/`onReveal`/`onRemove` optional, hides "Add Variable" button, hides Actions column header, hides all action buttons per row. Removed `SetupBanner` import and usage from `layout.tsx`.
- **Remove useSetupStatus from 7 consumer files**: Removed import, variable declaration, and all `!setupStatus?.isReady` conditions from `TaskDetailModal.tsx`, `ChatPanel.tsx`, `DesignDetailClient.tsx`, `ProjectChatArea.tsx`, `ProjectDetailClient.tsx`, `TestingArenaSidebar.tsx`, `testing-arena/[id]/page.tsx`. If OAuth is missing, sandbox creation error is now the feedback mechanism.
- **Migration**: Added `createPersonalTeamsAndMigrate` internalMutation to `migrations.ts`. For each user without a Personal team → creates one. For each repo with no `teamId` → finds owner's Personal team, patches `teamId`. Run via Convex dashboard after deploy.
- **Impact**: Env var model simplified from 3 tables to 2. Every user auto-gets a Personal team. OAuth tokens are team-scoped (stored in `teamEnvVars` as `CLAUDE_CODE_OAUTH_TOKEN`). Infrastructure vars come from `process.env` only. Setup banner and status checks removed — OAuth errors surface naturally during sandbox creation. Team env vars tab shows actual variables, not just a link. No type errors (`npx tsc` passes in both `packages/backend` and `apps/web`).

## Teams UI Fixes — Iteration 3 — 2026-02-24

- **Why**: Four UI issues after iteration 2 degraded UX: (1) repo card disconnected badge broke to its own row due to missing flex layout, (2) team env vars tab showed placeholder text with no management UI despite backend APIs being complete, (3) root pages (`/`, `/teams`) content width didn't match TopNavBar's `max-w-7xl` constraint, (4) sidebar logo trapped users on repo pages with no way back to root repos list.
- **Repo card layout**: Added `flex items-center` to CardContent in `ReposClient.tsx`. Badge now stays inline with repo info instead of wrapping to new row.
- **Team env vars UI**: Extracted shared `EnvVarsTable.tsx` component (340 lines) from `EnvVariablesClient.tsx` with props for `vars`, `onUpsert`, `onReveal`, `onRemove`, `description`. Supports add/edit inline rows, reveal/hide toggle, copy to clipboard, delete confirmation dialog. Refactored `EnvVariablesClient.tsx` to thin wrapper (15 lines) calling repo APIs. Updated `TeamDetailClient.tsx` env tab to use `EnvVarsTable` with team APIs. Team and repo env vars pages now identical UX, zero duplication.
- **Layout consistency**: Wrapped root page content in `layout.tsx` with same container as TopNavBar (`max-w-7xl px-4 sm:px-6 lg:px-8`) when `showTopNavBar === true`. Repo routes unaffected (no container). Pages now align properly.
- **Sidebar logo navigation**: Changed both logo links (mobile header + desktop sidebar) from conditional `href={isRepoRoute && repoSlug ? `/${repoSlug}` : "/"}` to always `href="/"`. Logo becomes global escape hatch to repos list. Users already have sidebar nav items to reach repo sub-pages.
- **Impact**: Disconnected badge inline on repo cards, team env vars fully functional with CRUD UI, root pages visually aligned with TopNavBar, sidebar logo provides consistent way to return home from any repo page. No backend changes, pure UI polish.

## Teams: Refactor Form State Management — 2026-02-24

- **Why**: Each form dialog used multiple `useState` calls (3-4 per form), creating cluttered code and making state updates verbose. This violates the principle of minimizing surface area of change.
- **Refactor approach**: Consolidated all form state into single objects per dialog. Team creation dialog now uses `createDialog` state object with `{ open, name, error, isSubmitting }`. Add member dialog uses `memberDialog` with `{ open, email, error, isSubmitting }`. Add repository dialog uses `repoDialog` with `{ open, selectedRepoId, error, isSubmitting }`.
- **State updates**: All updates use `setState(prev => ({ ...prev, field: value }))` pattern, ensuring immutability and preventing stale closure issues.
- **UX improvements**: Added Enter key support to submit forms (team creation and add member dialogs). Dialog state resets completely on close/submit via single state assignment.
- **Code reduction**: Removed 8 individual `useState` calls across both files, replaced with 3 consolidated state objects. Handler functions simplified from separate error/loading state management to single object updates.
- **Impact**: Form code is now more maintainable, easier to reason about, and follows React best practices. No functional changes to user experience, but cleaner implementation that's easier to extend.

## Teams: Auto-Slug Generation + Error Handling UI — 2026-02-24

- **Why**: Creating teams required manually entering a slug, creating friction and potential for mistakes. Form errors were only logged to console, leaving users confused when operations failed (e.g., "User not found" when adding team member, "Team already exists" on duplicate slug).
- **Backend — Auto-slugify**: Removed `slug` from `teams.create` args. Added `slugify()` helper that transforms team name into URL-friendly slug (lowercase, replaces spaces with hyphens, strips special chars). Mutation now auto-generates slug from name and validates uniqueness, throwing clear errors ("A team with this name already exists" instead of "Team with this slug already exists").
- **Frontend — Team creation UX**: Removed slug input field from create dialog. Added helper text "A URL-friendly slug will be generated automatically". Added error state, error display (red banner), and loading state ("Creating..." button text). Dialog now resets all state (name, error, isSubmitting) on close.
- **Frontend — Team member addition UX**: Added error state, error display, and loading state to add member dialog. Errors like "User not found" or "User is already a member" now shown in red banner below email input. Dialog resets state on close.
- **Frontend — Repository addition UX**: Added error state, error display, and loading state to add repo dialog. Errors now shown in red banner below repository selector. Dialog resets state on close.
- **Impact**: Team creation is now simpler (one field instead of two), slug conflicts are clear to users, and all form errors are visible in the UI instead of hidden in console.

## Teams Feature — Iteration 2: One Team Per Repo + Navigation — 2026-02-24

- **Why**: The first iteration allowed repos to belong to multiple teams (many-to-many via `teamRepos` join table), creating complexity and ambiguous ownership. Backward compatibility kept `connectedBy === undefined` repos visible to everyone, violating access control. Root-level pages (`/`, `/teams`) had no navigation between them, making the Teams feature feel disconnected from the main interface.
- **Schema changes**: Removed `teamRepos` table entirely. Added `teamId: v.optional(v.id("teams"))` field to `githubRepos` table with `by_team` index. Repos now have at most one team (1:1 relationship like Vercel).
- **Migration**: Created `migrations.ts` with `assignOrphanRepos` internalMutation that patches all `connectedBy === undefined` repos to assign them to a fallback user. This migration must be run manually via Convex dashboard to eliminate orphan repos before the new access logic takes effect.
- **Backend — Repo access**: Rewrote `githubRepos.list`, `get`, `getByOwnerAndName` to remove `connectedBy === undefined` fallback. Users now see repos where `connectedBy === userId` OR (`teamId` is defined AND user is a member of that team). No more global visibility for orphan repos.
- **Backend — New repo API**: Added `getTeamIdForRepo` internalQuery (accepts string repoId, returns `teamId | null`), `listByTeam` query (returns repos filtered by `by_team` index + membership check), `assignToTeam` mutation (patches `repo.teamId`), `removeFromTeam` mutation (patches `repo.teamId` to `undefined`).
- **Backend — Team cascade**: Updated `teams.remove` mutation to patch repos' `teamId` to `undefined` (instead of deleting join table rows) when team is deleted. Repos revert to personal ownership.
- **Backend — Env var resolution**: Rewrote `resolveTeamEnvVars()` in `daytona.ts` to call `getTeamIdForRepo` once, then `getForSandbox` once if teamId exists. No more loop over `teamRepos` join table. Fixed `startSessionSandbox` bug where team env vars were never merged — now uses same pattern as `setupAndExecute` and `startDesignSandbox` (fetch team vars + repo vars → merge with repo precedence → pass to `createSandbox`).
- **Backend — MCP routes**: Simplified `mcpRoutes.getDecryptedRepoEnvVars` to replace `teamRepos.getTeamsForRepoInternal` loop with single `getTeamIdForRepo` + `getForSandbox` call.
- **Frontend — Top nav bar**: Created `TopNavBar.tsx` component with logo/branding (left), Repositories and Teams links (center), and NotificationsPopoverClient + theme toggle + UserButton (right). Rendered conditionally in `layout.tsx` only when `pathname === "/" || pathname.startsWith("/teams") || pathname.startsWith("/setup")`. Repo routes and inbox retain their own Sidebar; TopNavBar is hidden for those routes.
- **Frontend — Sidebar cleanup**: Removed Teams link from `Sidebar.tsx` (replaced by TopNavBar).
- **Frontend — Team detail**: Updated `TeamDetailClient.tsx` to use new API — `api.githubRepos.listByTeam`, `api.githubRepos.assignToTeam`, `api.githubRepos.removeFromTeam`. Repos tab now renders direct repo objects (not join table entries). Fixed `selectedRepoId` state to use string instead of type assertion — lookup repo object by `_id` string match before calling `assignToTeam`.
- **Frontend — Team env vars**: Rewrote `TeamEnvVarsClient.tsx` to use `useRepo()` hook from RepoContext and check `repo.teamId` directly. If `repo.teamId` exists, query `api.teams.get({ id: repo.teamId })` to show single team card. If no `teamId`, show "not part of any team" message.
- **Frontend — Repos grouping**: Updated `ReposClient.tsx` to query `api.teams.list` alongside repos. Group repos by team: repos with `teamId === undefined` → "Personal", repos with `teamId` → grouped by team name. Render section headers per group with Personal first, then teams alphabetically.
- **Deleted files**: `packages/backend/convex/teamRepos.ts` (all references replaced by `teamId` field).
- **Impact**: Repos now have clear ownership (personal or team, never both). No more orphan repos visible to everyone. Team env vars flow through to all sandbox types including sessions (previously broken). Top nav bar provides clear navigation between Repositories and Teams pages. Repos page visually groups personal and team repositories for better organization.

## Teams Feature + Env Var Restructuring — 2026-02-24

- **Why**: All authenticated users could see all repos with no access control. Environment variables were split between repo-scoped and admin-only system vars with no team-level sharing. Users needed a way to collaborate on repos and share configurations across team repositories.
- **Schema changes**: Added 4 new tables (`teams`, `teamMembers`, `teamRepos`, `teamEnvVars`) for Vercel-like team model. Added `connectedBy` field to `githubRepos` to track who connected each repo. Removed `aiAccountStatus` table — rate-limiting code was never invoked.
- **Backend — Teams CRUD**: New modules `teams.ts`, `teamMembers.ts`, `teamRepos.ts` provide full team lifecycle management. Team owners can add/remove members, manage repos, and configure team-scoped environment variables.
- **Backend — Repo access control**: Modified `githubRepos.list`, `get`, and `getByOwnerAndName` to filter repos by access: users see repos they connected + repos from their teams + legacy repos (no `connectedBy`). Repos without `connectedBy` remain visible to all users for backward compatibility.
- **Backend — Env var hierarchy**: Added `resolveTeamEnvVars()` helper in `daytona.ts` that fetches team env vars for all teams a repo belongs to, decrypts them, and merges them. Sandbox creation now merges team vars + repo vars with repo vars taking precedence. Updated `setupAndExecute`, `startSessionSandbox`, `startDesignSandbox` to include team vars. MCP server `getDecryptedRepoEnvVars` also includes team vars.
- **Backend — AI account rotation**: Replaced dead `internal.aiAccounts.getAvailableAccountKey` call in `daytona.ts` with direct query to `systemEnvVars.getOAuthAccounts` (returns first claude_oauth account). Removed `aiAccountStatus` cleanup from `systemEnvVars.removeVar`. Deleted `aiAccounts.ts` entirely.
- **Frontend — Team management**: New `/teams` route lists user's teams with create dialog. New `/teams/[slug]` route shows team details with tabs for Members (add/remove, change roles), Repos (add/remove from user's connected repos), and Env Variables (team-scoped configuration).
- **Frontend — Env vars page**: Added "Team" tab to `EnvVariablesPageClient` showing teams this repo belongs to with links to manage team variables. Team env vars are inherited by all team repos (repo vars override team vars).
- **Frontend — Navigation**: Added "Teams" link to main sidebar (visible when not in a repo route) below the repo selector.
- **Impact**: Users can now create teams, collaborate on shared repos, and manage team-level environment variables that cascade to all team repositories. Access control ensures users only see repos they have permission to access. Legacy repos (migrated without `connectedBy`) remain visible to all users.

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

- **Why**: Two bugs prevented the MCP server from bootstrapping after deployment. First, the Convex bundler rejected `http.ts` because it statically imported `mcpRoutes.ts` → `encryption.ts` → `node:crypto`, and Convex's V8 HTTP router cannot have Node.js APIs in its import chain. Second, the bootstrap and env-vars endpoints were being called on the wrong domain — Convex HTTP actions are served at `.convex.site`, not `.convex.cloud`, but `CONVEX_CLOUD_URL` uses `.convex.cloud`.
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
- **Simplification**: MCP tools now use shared `CONVEX_CLOUD_URL` + `CONDUCTOR_DEPLOY_KEY` env vars for all Convex API calls. JWTs are self-contained (no database lookup needed). Removed `tokenStore` in-memory cache, `persistToken`, and `mcpTokens` table dependency. The `mcpTokens` table is now dead code (cleanup in follow-up).
- **New env vars**: `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` required on the MCP server (same values as the web app).

## System Env Var Validation + Infrastructure Category Cleanup — 2026-02-20

- **Why**: Workflows (sessions, projects, tasks, design, testing) failed mid-execution with cryptic errors like "No OAuth accounts available" when required system env vars weren't configured. No upfront validation or user feedback existed. Additionally, the admin UI exposed an "Infrastructure" category for vars that should be Convex env vars, not platform DB entries.
- **Validation**: New `getSetupStatus` Convex query checks if at least 1 OAuth token is configured. `useSetupStatus` hook + `SetupBanner` component show a persistent dismissible alert on all repo pages when setup is incomplete.
- **Hard block**: All 8 workflow trigger points (task execution, session chat, session sandbox auto-start, design send/sandbox, project build, project chat, testing arena) disable their action buttons when no OAuth tokens are configured.
- **Admin UI cleanup**: Removed the Infrastructure category from the System Variables admin page. Only OAuth tokens are shown/addable now — infrastructure vars should live as Convex env vars with process.env fallback.

## MCP Server: Persistent Token Storage — 2026-02-20

- **Why**: MCP server stored OAuth tokens (user Convex credentials) in in-memory Maps. Every Railway deploy/restart wiped all tokens, forcing users to re-authenticate by entering their Convex URL + deploy key again.
- **Solution**: New `mcpTokens` Convex table stores token→credentials mapping with encrypted deploy keys (AES-256-GCM via existing `encryption.ts`). MCP server writes to Convex on token creation (fire-and-forget) and falls back to Convex on cache miss after restart.
- **Architecture**: In-memory Map kept as hot cache for zero-latency reads. Convex actions (`mcpTokensActions.ts`) handle encryption/decryption server-side — MCP server only needs `CONVEX_CLOUD_URL` + `CONDUCTOR_DEPLOY_KEY` env vars, not `ENCRYPTION_KEY`.
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
- **Architecture**: Stateless Express server at `apps/mcp/` using `@modelcontextprotocol/sdk` with Streamable HTTP transport. OAuth 2.0 with PKCE flow stores Convex credentials (deployment URL + deploy key) in a signed JWT — no database needed.
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
