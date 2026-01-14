# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Root-level commands (from repo root):**

```bash
pnpm dev          # Start web dev server (Next.js with Turbopack)
pnpm convex       # Start Convex backend dev server
pnpm convex:deploy # Deploy Convex backend
pnpm inngest      # Start Inngest dev server for background jobs
pnpm api:web      # Generate Convex API types for web
```

**Web-specific commands (from /web):**

```bash
pnpm turbo        # Dev server with API generation
pnpm build        # Production build
pnpm lint         # ESLint
```

**Backend-specific commands (from /backend):**

```bash
npx convex dev       # Dev server with hot reload
npx convex deploy    # Deploy to production
```

## Architecture

This is a monorepo with three apps:

- **web/** - Next.js 15 frontend (App Router, Turbopack)
- **backend/** - Convex serverless backend (real-time database + API)
- **mobile/** - Expo/React Native app

### Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, HeroUI components, Clerk auth, ai-sdk with OpenRouter

**Backend:** Convex (database + mutations/queries), Resend (email), Inngest (background jobs)

**Key Integrations:** GitHub API via Octokit, Claude Code SDK, E2B for code execution

### Code Organization

```
web/
├── app/              # Next.js App Router pages
│   ├── (main)/       # Protected routes (Kanban, Features, Plans, Sessions)
│   ├── (landing)/    # Public landing page
│   └── api/          # Route handlers (chat, execute-task, github)
├── lib/
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts (Theme, Repo)
│   ├── hooks/        # Custom hooks
│   ├── github/       # GitHub API utilities
│   └── prompts/      # AI system prompts

backend/convex/
├── schema.ts         # Database schema
├── agentTasks.ts     # Task CRUD operations
├── agentRuns.ts      # Execution tracking
├── features.ts       # Feature branch management
├── plans.ts          # Planning workflows
└── sessions.ts       # Chat sessions
```

### Key Data Models

- **boards** - Kanban boards linked to GitHub repos
- **columns** - Board columns (todo, in_progress, code_review, done)
- **agentTasks** - Work items with status, branch names, GitHub links
- **agentRuns** - Task execution history with logs
- **features** - GitHub feature branches (planning → active → completed)
- **plans** - Development plans with conversation history
- **sessions** - Interactive chat sessions

## Conventions

- Use `@/*` import alias (maps to web root)
- Convex queries/mutations use validators - always use `.withIndex()` for efficient queries
- Forms use React Hook Form + Zod validation
- Dark mode via next-themes with HSL CSS variables
