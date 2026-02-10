# Changelog

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
