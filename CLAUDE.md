# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Root-level commands (from repo root):**

```bash
pnpm dev            # Start web dev server (Next.js with Turbopack)
pnpm convex         # Start Convex backend dev server
pnpm convex:deploy  # Deploy Convex backend
pnpm ext:dev        # Start chrome extension dev server
pnpm ext:build      # Build chrome extension
```

**Web-specific commands (from /apps/web):**

```bash
pnpm turbo        # Dev server
pnpm build        # Production build
pnpm lint         # ESLint
```

**Backend-specific commands (from /packages/backend):**

```bash
npx convex dev       # Dev server with hot reload
npx convex deploy    # Deploy to production
```

**Type checking (from /apps/web):**

```bash
npx tsc              # TypeScript type check
```

## Architecture

This is a monorepo (pnpm workspaces) with four apps and three shared packages:

- **apps/web/** - Next.js 15 frontend (App Router, Turbopack)
- **apps/chrome-extension/** - Chrome extension (Vite + React 19 + Radix UI, shadow DOM content scripts)
- **apps/mobile/** - Expo/React Native app (NativeWind for styling)
- **apps/teams-bot/** - Microsoft Teams bot
- **packages/backend/** - Convex serverless backend + shared package (`@conductor/backend`) exporting types (`Id`, `Doc`, `api`, `internal`)
- **packages/shared/** - Smart shared components and utilities (`@conductor/shared`) that depend on Convex/backend — used by web and chrome-extension
- **packages/ui/** - Shared UI components (`@conductor/ui`) used by web and chrome-extension

### Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui (Radix UI primitives), Clerk auth, ai-sdk with OpenRouter

**Backend:** Convex (database + mutations/queries + workflows), Resend (email)

**Key Integrations:** GitHub API via Octokit, Claude Code SDK, Daytona SDK for sandbox code execution

### Code Organization

```
apps/web/
├── app/              # Next.js App Router pages
│   ├── (main)/       # Protected routes requiring auth
│   │   ├── [repo]/   # Repo-scoped pages (projects, sessions, analyse, design, admin, docs, quick-tasks, testing-arena)
│   │   └── repos/    # Repository listing and setup
│   ├── (landing)/    # Public landing page
│   └── api/          # Route handlers
│       ├── github/   # GitHub branches, installation-token, repos
│       └── sessions/ # Preview (WebSocket) and terminal (PTY) endpoints
├── lib/
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts (Theme, Repo, Sidebar)
│   ├── hooks/        # Custom hooks
│   ├── github/       # GitHub API utilities
│   ├── sandbox.ts    # Daytona sandbox utilities (PTY, WebSocket)
│   └── prompts/      # AI system prompts
├── env/
│   ├── client.ts     # Client-side env vars (NEXT_PUBLIC_*)
│   └── server.ts     # Server-side env vars

packages/backend/convex/
├── schema.ts         # Database schema with all table definitions
├── agentTasks.ts     # Task CRUD operations
├── agentRuns.ts      # Execution tracking
├── projects.ts       # Project management
├── sessions.ts       # Chat sessions
└── analytics.ts      # Stats queries
```

### Sessions vs Projects

**Sessions** = interactive pair programming with AI. User has an initial idea and wants to develop it iteratively.

- User drives each step by sending messages one at a time
- Three modes: Execute (make changes), Ask (read-only Q&A), PRD (lightweight product requirements)
- PRD mode produces a free-form requirements doc via conversation, user approves then switches to execute
- One conversation, one branch, manual control
- Best for: quick changes, bug fixes, small features, exploring/developing ideas

**Projects** = autonomous feature builder. User has the final idea and wants to know how to get there, including edge cases.

- Structured interview flow (multiple choice questions) builds a comprehensive spec
- Auto-generates a task breakdown from the spec
- Executes ALL tasks autonomously without user input per task
- Has lifecycle phases (draft → finalized → active → completed)
- Best for: large features, multi-file changes, "build this and come back when it's done"

Keep these distinct: sessions should stay interactive and lightweight, projects should stay autonomous and structured. Don't add interview/task-breakdown to sessions or free-form chat to projects.

### Key Data Models

- **boards** - Kanban boards linked to GitHub repos
- **columns** - Board columns (todo, in_progress, code_review, done)
- **agentTasks** - Work items with status, branch names, GitHub links
- **subtasks** - Sub-items within tasks
- **taskComments** / **taskDependencies** / **taskProof** - Task metadata
- **agentRuns** - Task execution history with logs
- **projects** - Development projects with phases (draft → finalized → active → completed)
- **sessions** - Interactive Claude Code chat sessions with sandbox
- **docs** - Repository documentation
- **evaluationReports** - Doc evaluation results with requirements tracking
- **researchQueries** / **savedQueries** - Analytics queries with AI-generated insights
- **routines** - Scheduled automation routines
- **users** / **userMigrations** - User accounts with Clerk integration
- **githubRepos** - GitHub repository references
- **notifications** - User notifications
- **annotations** - Chrome extension annotations/highlights

### Convex Workflows (Durable Background Jobs)

Most background jobs use `@convex-dev/workflow` for durable orchestration. Located in `packages/backend/convex/`:

- **designWorkflow.ts** - Design session execution (Claude CLI writes variation files to `app/design-preview/`, commits on `design/{id}` branch, previewed via live iframe)
- **summarizeWorkflow.ts** - Summarizes session history (Haiku, no tools)
- **docPrdWorkflow.ts** - Parses uploaded PRD docs (Sonnet, read-only tools)
- **evaluationWorkflow.ts** - Evaluates docs against requirements (Sonnet, read-only tools, ephemeral sandbox)
- **docInterviewWorkflow.ts** - Doc interview Q&A + content generation (two separate workflows)
- **projectInterviewWorkflow.ts** - Project interview Q&A + spec generation (two separate workflows)
- **testGenWorkflow.ts** - Generates tests with git ops and PR creation (Sonnet, write tools, ephemeral sandbox)
- **taskWorkflow.ts** + **taskWorkflowActions.ts** - Task execution (Claude CLI implements code changes, creates PRs, runs audits). Actions split to separate file for Node.js runtime (Daytona SDK, LlmJson).
- **buildWorkflow.ts** - Sequential project build (orchestrates multiple task executions via inter-workflow events)

**Workflow pattern**: Frontend calls `startXxx` mutation → `workflow.start()` → action fires Daytona sandbox with `nohup` → sandbox runs Claude CLI → sandbox calls back via `POST /api/mutation` with Clerk JWT → `handleCompletion` mutation calls `workflow.sendEvent()` → workflow saves result.

**Simple async pattern** (sessions/projects): Frontend calls public mutation → mutation does immediate DB writes + `ctx.scheduler.runAfter(0, internalAction)` → action does Daytona work → action calls `ctx.runMutation(internalMutation)` to update DB when done.

**Shared utilities** in `daytona.ts`: `buildCallbackScript(completionMutation, entityIdField)`, `launchScript(sandbox, prompt, ...)`, `setupBranch(sandbox, branchName)`, `setupAndExecute` (generic internalAction), `deleteSandbox`, `startSessionSandbox`.

**Token flow**: Frontend calls `getWorkflowTokens(installationId)` server action (in `apps/web/app/(main)/[repo]/actions.ts`) to get GitHub + Convex tokens, passes them to the start mutation.

### Shared UI Package (`packages/ui/`)

Shared UI primitives and AI Elements components live in `@conductor/ui` (source-only, no build step). Both web/ and chrome-extension/ import from this package:

```typescript
import {
  Button,
  cn,
  Dialog,
  Conversation,
  MessageResponse,
} from "@conductor/ui";
```

**UI primitives:** button, button-group, collapsible, command, dialog, dropdown-menu, hover-card, input, input-group, select, separator, spinner, tabs, textarea, tooltip

**AI Elements:** Conversation, Message, PromptInput, Reasoning, Shimmer

Web-only components (accordion, avatar, badge, card, checkbox, label, popover, progress) remain in `apps/web/lib/components/ui/`.

### Convex Extensions

The backend uses four Convex component extensions (configured in `packages/backend/convex/convex.config.ts`):

- `@convex-dev/workflow` - Durable workflows with retry, timeout, and event-driven orchestration
- `@convex-dev/presence` - Real-time presence tracking (heartbeat in main layout)
- `@convex-dev/prosemirror-sync` - Collaborative editing with Tiptap
- `convex-timeline` - Timeline/history tracking

### Middleware & Auth

`apps/web/middleware.ts` uses Clerk middleware with:

- `DISABLE_AUTH=true` env var bypasses auth (for dev/testing)
- CORS headers for `chrome-extension://` origins
- Extension-specific routes: `/api/extension/*`
- `auth.protect()` on all non-public routes

### Key Validators

Defined in `packages/backend/convex/validators.ts` — use these when writing Convex mutations/queries:

- **taskStatus**: `todo | in_progress | business_review | code_review | done`
- **runStatus**: `queued | running | success | error`
- **sessionMode**: `execute | ask | plan | flag`
- **sessionStatus**: `active | closed`
- **phase** (projects): `draft | finalized | active | completed`
- **notificationType**: `routine_complete | export_ready | task_complete | task_assigned | comment_added | run_completed | system`
- **roleUser**: `business | dev`

## Git Hooks

Pre-commit runs `lint-staged` via Husky, which formats staged `*.{ts,tsx,js,jsx,json,css,md}` files with Prettier.

## Conventions

- Use `@/*` import alias (maps to web root)
- Convex queries/mutations use validators - always use `.withIndex()` for efficient queries
- Import `api`, `Id`, `Doc` from `@conductor/backend` (NOT from `convex/values` or a local api.ts)
- Use `FunctionReturnType` from Convex to derive types instead of manually defining interfaces
- Forms use React Hook Form + Zod validation
- Dark mode via next-themes with OKLCH CSS variables (space-separated channels: `--primary: 0.591 0.107 178.242;`) — supports Tailwind opacity modifiers (`bg-primary/10`)
- Environment variables validated with @t3-oss/env-nextjs and Zod (import from `@/env/server` or `@/env/client`)
- Default to Server Components; only use Client Components (`*Client.tsx`) for interactive elements requiring hooks, events, or browser APIs
- Icons: `@tabler/icons-react` (primary), `lucide-react` (secondary)
- URL state management with `nuqs` for search/filter/sort params
- Daytona sandboxes: snapshot-based (`eva-snapshot`), auto-stop 15min, auto-delete 30min, non-root user `eva`

### Desktop App (`apps/desktop/`)

Electron app (electron-vite v3) for interactive AI coding sessions. Session-based terminal manager wrapping CLI tools (Claude Code, OpenCode, Codex).

**Architecture:** Three-panel layout — session sidebar (left), terminal + diff tabs (center), git panel (right). Clicking a file in the git panel opens a diff tab in the center panel (VS Code style) via `DiffTabContext`.

**Key modules:**

- `src/main/db/database.ts` — SQLite init (WAL mode, foreign keys), connection getter, close
- `src/main/db/migrations.ts` — Version-stamped migrations using `PRAGMA user_version`
- `src/main/db/queries.ts` — All prepared statement wrappers for sessions, tabs, preferences
- `src/main/session/store.ts` — SQLite-backed session CRUD (sessions persist across restarts)
- `src/main/session/tab-spawner.ts` — Spawns PTY + writes tool command (e.g. `claude\r`) after delay; `respawnTab()` for session restore
- `src/main/git/operations.ts` — Git operations via `simple-git` (status, stage, unstage, commit, diff)
- `src/main/git/watcher.ts` — File watching via `chokidar` with 500ms debounce, notifies renderer of changes
- `src/main/pty/manager.ts` — PTY lifecycle (spawn, write, resize, kill) via `node-pty`
- `src/renderer/contexts/SessionContext.tsx` — React context for session state
- `src/renderer/contexts/DiffTabContext.tsx` — Shared context for diff tabs (bridges GitPanel ↔ SessionPage siblings)
- `src/renderer/components/terminal/TerminalView.tsx` — xterm.js terminal (does NOT spawn/kill PTY — lifecycle managed by tab-spawner)
- `src/renderer/components/git/GitPanel.tsx` — Git staging/commit UI with auto-refresh

**Type check:** `npx tsc --noEmit -p tsconfig.json` (renderer) and `npx tsc --noEmit -p tsconfig.node.json` (main/preload)

**ESM deps in main process:** `nanoid` and `chokidar` are ESM-only — must be excluded from `externalizeDepsPlugin()` in `electron.vite.config.ts` so they get bundled rather than `require()`d at runtime.
