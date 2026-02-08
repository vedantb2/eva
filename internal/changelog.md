# Changelog

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
