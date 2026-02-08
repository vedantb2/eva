# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Root-level commands (from repo root):**

```bash
pnpm dev            # Start web dev server (Next.js with Turbopack)
pnpm convex         # Start Convex backend dev server
pnpm convex:deploy  # Deploy Convex backend
pnpm inngest        # Start Inngest dev server for background jobs
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

This is a monorepo (pnpm workspaces) with four apps and two shared packages:

- **apps/web/** - Next.js 15 frontend (App Router, Turbopack)
- **apps/chrome-extension/** - Chrome extension (Vite + React 19 + Radix UI, shadow DOM content scripts)
- **apps/mobile/** - Expo/React Native app (NativeWind for styling)
- **apps/teams-bot/** - Microsoft Teams bot
- **packages/backend/** - Convex serverless backend + shared package (`@conductor/backend`) exporting types (`Id`, `Doc`, `api`, `internal`)
- **packages/ui/** - Shared UI components (`@conductor/ui`) used by web and chrome-extension

### Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui (Radix UI primitives), Clerk auth, ai-sdk with OpenRouter

**Backend:** Convex (database + mutations/queries), Resend (email), Inngest (background jobs)

**Key Integrations:** GitHub API via Octokit, Claude Code SDK, Daytona SDK for sandbox code execution

### Code Organization

```
apps/web/
├── app/              # Next.js App Router pages
│   ├── (main)/       # Protected routes requiring auth
│   │   ├── [repo]/   # Repo-scoped pages (projects, sessions, analyse, admin, docs, quick-tasks, testing-arena)
│   │   └── repos/    # Repository listing and setup
│   ├── (landing)/    # Public landing page
│   └── api/          # Route handlers
│       ├── github/   # GitHub branches, installation-token, repos
│       ├── inngest/  # Inngest webhook + manual trigger
│       └── sessions/ # Preview (WebSocket) and terminal (PTY) endpoints
├── lib/
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts (Theme, Repo, Sidebar)
│   ├── hooks/        # Custom hooks
│   ├── github/       # GitHub API utilities
│   ├── inngest/      # Background job definitions and sandbox helpers
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

### Inngest Background Jobs

Located in `apps/web/lib/inngest/functions/`:

- **execute-task** - Runs agent tasks in Daytona sandbox
- **session-execute** - Executes commands within a session sandbox
- **session-sandbox** (start-sandbox / stop-sandbox) - Manages Daytona sandbox lifecycle for sessions
- **summarize-session** - Summarizes session history
- **cleanup-project-sandbox** - Tears down inactive project sandboxes
- **execute-research-query** - Runs analytics queries with AI
- **interview-question** / **interview-spec** / **interview-chat** - Project interview workflow
- **evaluate-doc** - Evaluates documentation against requirements

### Sandbox Execution

The `apps/web/lib/inngest/sandbox.ts` module provides utilities for Daytona sandbox operations:

- `getGitHubToken()` - Gets installation token from GitHub App
- `cloneRepo()` / `setupBranch()` - Git operations in sandbox
- `runClaudeCLI()` - Execute Claude Code CLI with model/tool options
- `ensureProjectSandbox()` - Create or reuse existing sandbox

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

## Conventions

- Use `@/*` import alias (maps to web root)
- Convex queries/mutations use validators - always use `.withIndex()` for efficient queries
- Import `api`, `Id`, `Doc` from `@conductor/backend` (NOT from `convex/values` or a local api.ts)
- Use `FunctionReturnType` from Convex to derive types instead of manually defining interfaces
- Forms use React Hook Form + Zod validation
- Dark mode via next-themes with HSL CSS variables
- Environment variables validated with @t3-oss/env-nextjs and Zod (import from `@/env/server` or `@/env/client`)
- Default to Server Components; only use Client Components (`*Client.tsx`) for interactive elements requiring hooks, events, or browser APIs
