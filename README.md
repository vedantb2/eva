# Eva

> Plan, build, verify, and ship changes to your repositories with AI agents running in cloud sandboxes

**Fully open source** under the [MIT License](LICENSE).

Eva gives coding agents a real development environment instead of a restricted tool sandbox. Each agent gets a cloud VM with your repository cloned, dependencies installed, and a running dev server, so it can:

- run shell commands and install packages
- execute your test suite
- build the app and drive a real browser against it
- open pull requests with screenshots or video as proof
- call back into Eva mid-task to ask you a question

Work runs remotely and in parallel, so you can start several changes at once and review them when they finish.

```
GitHub repository
        │
        ▼
      Eva  ──────────────────────────────┐
        │                                │
        ▼                                ▼
Cloud sandbox                      Eva MCP server
(Vercel Sandbox)                   (agents call back in)
        │
        ▼
Agent CLI (Claude Code, Codex, opencode, Cursor)
        │
        ▼
Diff → draft PR → PR recap → preview URL
```

## The loop

Eva covers four stages. Most features map onto one of them.

| Stage       | Surfaces                                   |
| ----------- | ------------------------------------------ |
| **Plan**    | Documents, Projects, guided interviews     |
| **Build**   | Sessions, Quick Tasks, Designs             |
| **Verify**  | Reviews, Testing Arena, Audits, task proof |
| **Operate** | Automations, Snapshots, Stats, Inbox       |

## Quick start

1. Connect a GitHub repository
2. Build a sandbox snapshot so environments start fast
3. Start a session, or run a quick task such as "fix the failing checkout tests"
4. Review the diff and preview, then open a pull request

## Features

### Plan

**Documents** — collaborative PRDs and specs, edited in real time. Agents read them during tasks, and a guided interview can draft the description, requirements, and user flows for you.

**Projects** — larger multi-task work with kanban, timeline, list, and table views. A project moves through draft, finalised, in progress, business review, code review, and completed. The build pipeline runs every outstanding task in order, on demand or on a schedule.

### Build

**Sessions** — an interactive coding session against a branch. Chat on the left; on the right a live sandbox with preview, terminal, file tree, editor, PR diffs, and an agent-controlled browser. You can click an element in the live preview to turn it into a prompt. Agents may spawn background sub-agents, which you can stop individually.

**Quick Tasks** — self-contained changes, each in its own sandbox, run in parallel. Kanban, table, and split-list views, with bulk actions, filters, and import from Linear.

**Designs** — chat-driven UI work that generates several design variations per session, steered by reusable personas. This feature is complete but currently gated behind a development-only navigation flag.

**Agent choice** — four CLIs are supported, each with its own model list: Claude Code, Codex, opencode, and Cursor. Cursor can route to Grok, Gemini, and Composer models. Model, reasoning effort, and thinking mode are set per turn. Users may connect their own agent accounts under **Settings → Accounts** so usage bills to them rather than the team.

### Verify

**Reviews** — a pull request hub with live GitHub metadata, diffs, and an AI-generated recap. Eva also posts a sticky recap comment on the pull request and keeps it updated as the branch changes.

**Testing Arena** — evaluates the codebase against a document's stated requirements on a chosen branch and returns a severity-ranked list of gaps. Fixing is opt-in: selected issues can be handed to an agent that opens a pull request.

**Audits** — configurable review categories that run against a change and append findings to the pull request. Selected findings can be fixed automatically.

**Proof** — tasks capture screenshots and video of the running app, so a pull request shows the change working rather than only describing it.

### Operate

**Automations** — scheduled agent runs per repository, on a cron expression. Report-only mode records findings without touching the code; action mode can open a pull request. Findings can be promoted to tasks, and results can be emailed.

**Snapshots** — prebuilt sandbox images bundling the OS, tooling, agent CLIs, dependencies, and a seeded database, so sandboxes start with data already loaded. Rebuilds run manually or on a cron.

**Skills** — agent skills stored in your repository under `.agents/skills` are synced on push and every six hours, with staleness tracking.

**Stats** — pull requests shipped over time, session funnel, activity heatmap, and a contributor leaderboard.

**Inbox and email** — an in-app notification feed plus an optional daily unread digest and weekly changelog email.

**Teams** — team workspaces with members and roles, repository ownership, team-scoped environment variables, and branding.

**Monorepos** — Eva treats each deployable app in a monorepo as its own workspace, while sharing automations, snapshots, environment variables, and recaps from the canonical repository where that makes sense.

### MCP

Eva is an MCP server as well as a client of its own tools, in two directions.

**Outward** — external MCP clients such as Claude Desktop connect over OAuth 2.1 with dynamic client registration. Roughly twenty-five tools are exposed, including read-only queries against a connected repository's own Convex or Postgres database, task creation with dependency graphs, document access, pull request recaps, hosted artifacts, media upload, and shared browser control.

**Inward** — every sandbox is launched with Eva registered as an MCP server, so whichever agent CLI is running can call back into Eva part-way through a task to read a document, create a follow-up task, or ask you a blocking question.

**Artifacts** — self-contained HTML dashboards, hosted by Eva and rendered in a sandboxed iframe, which query live data through those same read-only tools.

## Repository layout

| Package                 | Name                   | Description                                                    |
| ----------------------- | ---------------------- | -------------------------------------------------------------- |
| `apps/web`              | `@eva/web`             | Main dashboard for repositories, sessions, tasks, and settings |
| `apps/chrome-extension` | `eva-assist-extension` | On-page toolbar to annotate any running app and file a task    |
| `packages/backend`      | `@eva/backend`         | Convex backend, workflows, and the in-sandbox callback runtime |
| `packages/shared`       | `@eva/shared`          | Shared constants and types                                     |
| `packages/ui`           | `@eva/ui`              | Shared component library                                       |

## Tech stack

- **Frontend**: Vite, TanStack Router, React 19, Tailwind CSS
- **Backend**: Convex, with the workflow, crons, presence, prosemirror-sync, and action-cache components
- **Sandboxes**: Vercel Sandbox
- **Auth**: Clerk
- **Email**: SendGrid

### Sandbox provider

**Vercel Sandbox is the only provider.** It restores snapshots in roughly 0.3 seconds regardless of size, which is what motivated adopting it. There is no provider setting to configure — supply the Vercel credentials in Step 7 and that is all.

The layout:

| Path                                    | Role                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `convex/_sandbox/`                      | Provider contract (`provider.ts`) and the Vercel implementation           |
| `convex/_sandbox_runtime/`              | Sandbox orchestration: launch, git, sessions, exec, proof, desktop, proxy |
| `convex/sandbox.ts`, `sandboxDaemon.ts` | Public action entrypoints (`internal.sandbox.*`)                          |
| `convex/_pty/vercel.ts`                 | Terminals (tmux over Vercel's `openInteractive` WebSocket)                |

**Terminals, desktop, and computer use all work.** PTY is wired in `convex/_pty/vercel.ts` and dispatched from `convex/pty.ts`, deliberately not through a provider interface, because Vercel exposes a client-connect WebSocket rather than a push-callback model. Desktop runs on TigerVNC plus noVNC in `VercelDesktop`.

**Named volumes are not implemented.** Vercel Drives are still beta, so `ensureVolume` does not exist and nothing depends on it. Session persistence uses snapshots instead.

Some Daytona-era naming survives on purpose, because live data still references it: a `DAYTONA_UUID` guard in `_sandbox/resolveExistingSandboxId.ts` (old sandbox ids are UUIDs; Vercel names are not), provider inference in `_repoSnapshots/builds.ts` so historical builds still render a correct badge, and `v.literal("daytona")` in the enum validators. Removing those needs a data migration first — see `internal/plans/todo/daytona-legacy-data-cleanup.md`.

## Self-hosting

Eva is self-hosted. There is no managed cloud version. You create your own Convex deployment, set up your own Clerk project, and run the app yourself. This gives you full control over your data and infrastructure.

### Prerequisites

- Node.js 20 or later
- pnpm 10 (see `packageManager` in `package.json`)
- Convex account
- Clerk account
- Vercel account with Sandbox API access
- GitHub account, for the GitHub App

### Step 1: Clone and install

```bash
git clone https://github.com/your-org/eva.git && cd eva && pnpm install
```

### Step 2: Set up Convex

The Convex project lives in `packages/backend`, so run it through the workspace script rather than from the repository root:

```bash
pnpm convex
```

Follow the prompts to create or link a Convex project. Note your deployment URL, for example `https://your-deployment.convex.cloud`.

### Step 3: Set up Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Note your **Publishable Key**, which starts with `pk_`
3. Note your **JWT Issuer Domain** from Clerk Dashboard → JWT Templates, for example `https://your-app.clerk.accounts.dev`

### Step 4: Create a GitHub App

1. Go to **GitHub Settings → Developer settings → GitHub Apps → New GitHub App**
2. Configure:
   - **Name**: `Eva (your-org)`
   - **Homepage URL**: your Eva instance URL
   - **Webhook URL**: `https://your-deployment.convex.site/api/github/webhook`
   - **Webhook secret**: generate a random string and save it for `GITHUB_WEBHOOK_SECRET`
3. **Repository permissions**:
   - Contents: Read and write
   - Pull requests: Read and write
   - Issues: Read and write
   - Metadata: Read-only
4. **Subscribe to events**: Push, Pull request, Installation
5. Click **Create GitHub App**
6. After creation, note:
   - **App ID** → `GITHUB_APP_ID`
   - **Client ID** → `GITHUB_CLIENT_ID`
   - **App slug**, from the public URL `github.com/apps/<slug>` → `GITHUB_APP_SLUG`
7. Generate:
   - **Client secret** → `GITHUB_CLIENT_SECRET`
   - **Private key**, a `.pem` file → `GITHUB_PRIVATE_KEY`
8. **Install the app** on your account or organisation
9. Look up the App's bot user ID. This is used as the git commit author email so commits are attributed to the bot on GitHub. App IDs and bot user IDs live in different namespaces, so the App ID will not work here.

   ```bash
   curl -s https://api.github.com/users/<slug>\[bot\] | jq .id
   ```

   Use the result for `GITHUB_BOT_USER_ID`.

### Step 5: Generate keys

```bash
openssl rand -hex 32
```

Run that twice, for `ENCRYPTION_KEY` and `EVA_DEPLOY_KEY`.

```bash
openssl ecparam -genkey -name prime256v1 -noout -out private.pem && openssl ec -in private.pem -pubout -out public.pem
```

Convert the pair to JWK format using the `jose` CLI. Use the full JWK including the `d` parameter for `SANDBOX_JWT_PRIVATE_KEY`, and the public-only JWKS for `SANDBOX_JWT_JWKS`.

### Step 6: Set environment variables

#### Web app (`apps/web/.env.local`)

Validated by `apps/web/src/env/client.ts`, so a missing required value fails at startup rather than at runtime.

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_NEW_LANDING=false
```

`VITE_NEW_LANDING=true` switches the marketing landing page to the newer layout.

#### Convex (`npx convex env set VAR value`, from `packages/backend`)

**Required:**

| Variable                  | Value                                      |
| ------------------------- | ------------------------------------------ |
| `CLERK_JWT_ISSUER_DOMAIN` | `https://your-app.clerk.accounts.dev`      |
| `ENCRYPTION_KEY`          | 64-character hex string from Step 5        |
| `EVA_DEPLOY_KEY`          | 64-character hex string from Step 5        |
| `GITHUB_APP_ID`           | App ID from the GitHub App                 |
| `GITHUB_APP_SLUG`         | App slug from `github.com/apps/<slug>`     |
| `GITHUB_BOT_USER_ID`      | Numeric bot user ID from the Step 4 lookup |
| `GITHUB_CLIENT_ID`        | Client ID from the GitHub App              |
| `GITHUB_CLIENT_SECRET`    | Client secret from the GitHub App          |
| `GITHUB_PRIVATE_KEY`      | Full contents of the `.pem` file           |
| `GITHUB_WEBHOOK_SECRET`   | Random string from Step 4                  |
| `WEB_APP_URL`             | Public URL of your Eva instance            |

**Optional:**

| Variable                     | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `SANDBOX_JWT_PRIVATE_KEY`    | ES256 JWK for sandbox authentication (JSON)      |
| `SANDBOX_JWT_JWKS`           | Public JWKS for sandbox authentication (JSON)    |
| `PREVIEW_GRANT_PRIVATE_KEY`  | Signs short-lived grants for shared preview URLs |
| `MCP_BOOTSTRAP_SECRET`       | Secret for the MCP bootstrap API                 |
| `MCP_JWT_SECRET`             | Secret for MCP JWT signing                       |
| `MCP_INTERNAL_SECRET`        | Secret for internal MCP calls                    |
| `CLERK_SECRET_KEY`           | Clerk secret key, used by the MCP server         |
| `SENDGRID_API_KEY`           | Enables notification and digest email            |
| `EMAIL_ENV`                  | Routes email by environment                      |
| `EXTENSION_ADMIN_KEY`        | Publishes Chrome extension auto-update releases  |
| `EXTENSION_ID`               | Chrome extension ID for the update feed          |
| `SANDBOX_VERCEL_VCPUS`       | vCPU count for Vercel sandboxes                  |
| `TASK_PROOF_CAPTURE_ENABLED` | Toggles screenshot and video capture for tasks   |

**Git default branch, not an environment variable:** when a task has no `baseBranch` and the repository has no **Default base branch** set under **Settings → Config**, sandboxes and pull requests fall back to `staging` (`FALLBACK_GIT_BASE_BRANCH` in `@eva/shared`). Team and repository environment variables apply inside sandboxes only; they do not set the pull request merge base.

### Step 7: Add sandbox credentials

Sandbox credentials are stored as **team or repository environment variables** in the dashboard, not as Convex deployment environment variables. Go to **Team Settings → Environment Variables** and add, from your Vercel account:

- `VERCEL_TOKEN`
- `VERCEL_TEAM_ID`
- `VERCEL_PROJECT_ID`

`VERCEL_TOKEN` and `VERCEL_TEAM_ID` may be shared across a monorepo's apps via team environment variables, but **`VERCEL_PROJECT_ID` must be set on each app repository** and is never borrowed from a sibling, or an app would create sandboxes under another app's Vercel project.

### Step 8: Run

```bash
pnpm convex
```

```bash
pnpm dev
```

Open `http://localhost:5173`.

Deploying with `pnpm convex:deploy` runs `build:callback` first, which bundles the in-sandbox callback runtime from `packages/backend/callback-src`. Changes to that runtime only reach sandboxes once this has run.

## MCP connections

Eva can query a connected repository's own database on your behalf. Add the repository's Convex URL, or a Postgres read-replica URL, to the repository or team environment variables in the dashboard. Postgres access is read-only, one statement per call, with a 30-second timeout and a size cap.

Per-repository MCP behaviour is configured under **Settings → MCP Config**, which sets the root prompt exposed to MCP clients.

## Sandbox snapshots

Eva runs agents inside sandboxes that boot from prebuilt snapshots. Snapshots bundle the OS, system tooling, agent CLIs, your dependencies, a clone of your repository, and optionally a seeded database, so sandboxes start quickly and with data already present.

### How it works

Eva builds snapshots from the backend. No GitHub Actions workflow is involved. A fresh Vercel sandbox boots a bare `node24` image with none of Eva's tooling installed, so the build runs against a **seed-prep sandbox** in `packages/backend/convex/snapshotActions.ts`:

1. Boot a seed-prep sandbox and install the required tooling
2. Clone your repository at the configured branch using a GitHub installation token, then run `pnpm install`
3. Run any configured build and seed commands
4. Capture the filesystem into a snapshot (`snap_*`) so later sandboxes boot from it directly

The build is split into separately polled phases because Convex actions have a ten-minute ceiling. Captures normally finish in around six minutes, but have been observed taking forty minutes or more when the builder fleet is degraded.

### Rebuilding a snapshot

Open the repository's **Settings → Snapshots**:

- **Configuration** — snapshot name, branch to clone (defaults to `main`), rebuild **Schedule** as a cron expression or `manual`, and **Build Commands** that run after `pnpm install`
- **Status** — **Rebuild Now** triggers a build on demand
- **Builds** — build progress and logs
- **Config Files** — upload files, such as database seeds, to bake into the image

If a snapshot is missing or in an error state, sandbox creation falls back to a bare sandbox plus a fresh clone and tooling install, so tasks still run. The first setup is slower.

### What is in the snapshot

- Base image: `node24`, plus pnpm and Node tooling
- System packages: git, git-lfs, curl, jq, ripgrep, fd, gh CLI, sudo, ffmpeg
- Desktop stack: Xvfb, XFCE, x11vnc, noVNC, and Google Chrome, for browser automation and computer use
- Docker Engine 28.3.3, for nested containers such as `supabase start`
- Agent CLIs: Claude Code, Codex, opencode (npm), and Cursor (`cursor-agent`, installed via `curl`)
- agent-browser, Convex CLI, Supabase CLI 2.90.0, `agentation-mcp`, the Claude Agent SDK, and code-server for VS Code in the browser

`ffmpeg` is required by `agent-browser record`. To change the base tooling, edit `launchSeedRun` in `packages/backend/convex/snapshotActions.ts`, which installs the toolchain onto the seed-prep sandbox before capture. For project-specific needs, prefer **Build Commands** and **Config Files** over editing the base tooling definition.

### When to rebuild

- Dependencies change significantly, such as a new major package
- The base tooling changes, such as a Node.js version or system package
- You want sandboxes to start from a fresher copy of the codebase or seed data

## Agent browser

Screenshots and video walkthroughs require the `agent-browser` skill to be installed in the codebase being worked on.

## Authentication in preview URLs

Preview URLs may fail to authenticate if your auth provider blocks frame ancestors, as AuthKit does. Options, simplest first:

1. **Open the preview in a new tab.**
2. **Allowlist the sandbox domain** in your auth provider's allowed origins and callback URLs, then use the embedded preview.
3. **Implement a backend login path** that renders inside an iframe without calling your auth provider, and document the flow in your `CLAUDE.md` so the agent can use it with `agent-browser`.

This restriction is not specific to Eva. It is standard iframe security behaviour.

## Development notes

- Typecheck Convex without a dev server: `cd packages/backend && npx convex codegen --typecheck enable`
- Lint: `pnpm lint` (oxlint). Dead code: `pnpm deadcode` (knip).
- Chrome extension: `pnpm ext:dev`, `pnpm ext:build`, `pnpm ext:release`
- `schemaValidation` is currently disabled in `packages/backend/convex/schema.ts` to tolerate schema drift on development deployments. This is a development convenience, not a pattern to copy.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CLAUDE.md](CLAUDE.md) for coding conventions.

## Roadmap

- Null out legacy Daytona sandbox ids and drop the `daytona` enum literal, so the compatibility guards can go (`internal/plans/todo/daytona-legacy-data-cleanup.md`)
- Release Designs to production, beyond the current development-only flag
- Improved project interview experience
