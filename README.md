# Eva

> Manage coding agents inside cloud development environments connected to your repositories

**Fully open source** under the [MIT License](LICENSE).

Instead of editing code locally or inside restricted LLM sandboxes, Eva provisions full development environments where agents can:

• run shell commands
• install dependencies
• execute tests
• build and preview apps
• open pull requests

```
GitHub Repository
        ↓
       Eva
        ↓
Cloud Sandbox (Daytona)
        ↓
AI Agent (Claude, Codex, opencode, Cursor)
        ↓
Code Changes → Diff → Pull Request → Preview
```

## Quick Start

1. Connect your GitHub repository
2. Build a sandbox snapshot with your dependencies
3. Run a task (e.g. “fix failing tests”)
4. Review the diff and open a pull request

## Features

### Quick Tasks

Describe a bug or change and Eva spins up an isolated sandbox to execute it. Tasks run independently so you can launch multiple in parallel.

### Sessions

Persistent cloud development environments with live previews where you and the agent collaborate in real time.

### Projects

Structured workflows for larger changes. Agents can plan, implement, and verify features across your codebase.

### Documents

Store PRDs, specs, and context that the agent references during tasks. Keep your requirements close to the work.

### Testing

Run your test suite in sandboxes automatically. Validate changes before they land without tying up local resources.

### MCP

Access your connected databases (Convex, Supabase) directly from Claude. Query, inspect, and debug your data without leaving your AI workflow.

## Tech Stack

- **Frontend**: Vite, TanStack Router, React, Tailwind CSS
- **Backend**: Convex
- **Sandboxes**: Daytona SDK
- **Auth**: Clerk

## Apps

| App                     | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `apps/web`              | Main dashboard for managing repos, tasks, and sessions |
| `apps/chrome-extension` | Browser extension for quick task execution             |

## Self-Hosting

Eva is self-hosted - there is no managed cloud version. You create your own Convex deployment, set up your own Clerk project, and run the app yourself. This gives you full control over your data and infrastructure.

## Setup

### Prerequisites

- Node.js 20+
- pnpm
- Convex account
- Clerk account
- Daytona account
- GitHub account (for GitHub App)

### Step 1: Clone and Install

```bash
git clone https://github.com/your-org/eva.git
cd eva
pnpm install
```

### Step 2: Set Up Convex

```bash
npx convex dev
```

Follow the prompts to create or link a Convex project. Note your deployment URL (e.g. `https://your-deployment.convex.cloud`).

### Step 3: Set Up Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Note your **Publishable Key** (starts with `pk_`)
3. Note your **JWT Issuer Domain** from Clerk Dashboard → JWT Templates (e.g. `https://your-app.clerk.accounts.dev`)

### Step 4: Create GitHub App

1. Go to **GitHub Settings → Developer settings → GitHub Apps → New GitHub App**
2. Configure:
   - **Name**: `Eva (your-org)`
   - **Homepage URL**: your Eva instance URL
   - **Webhook URL**: `https://your-deployment.convex.site/api/github/webhook`
   - **Webhook secret**: generate a random string (save for `GITHUB_WEBHOOK_SECRET`)
3. **Repository permissions**:
   - Contents: Read & write
   - Pull requests: Read & write
   - Issues: Read & write
   - Metadata: Read-only
4. **Subscribe to events**: Push, Pull request, Installation
5. Click **Create GitHub App**
6. After creation, note:
   - **App ID** → `GITHUB_APP_ID`
   - **Client ID** → `GITHUB_CLIENT_ID`
   - **App slug** (from the public URL `github.com/apps/<slug>`) → `GITHUB_APP_SLUG`
7. Generate:
   - **Client secret** → `GITHUB_CLIENT_SECRET`
   - **Private key** (.pem file) → `GITHUB_PRIVATE_KEY`
8. **Install the app** on your account/org
9. Look up the App's bot user ID — this is used as the git commit author email so commits are attributed to the bot on GitHub (App IDs and bot user IDs live in different namespaces):

   ```bash
   curl -s https://api.github.com/users/<slug>\[bot\] | jq .id
   # → Use for GITHUB_BOT_USER_ID
   ```

### Step 5: Generate Keys

```bash
# Generate 32-byte encryption key (hex)
openssl rand -hex 32
# → Use for ENCRYPTION_KEY

# Generate deploy key
openssl rand -hex 32
# → Use for EVA_DEPLOY_KEY

# Generate ES256 key pair for sandbox JWT
openssl ecparam -genkey -name prime256v1 -noout -out private.pem
openssl ec -in private.pem -pubout -out public.pem
# Convert to JWK format (use online tool or jose CLI)
# → SANDBOX_JWT_PRIVATE_KEY (full JWK with "d" parameter)
# → SANDBOX_JWT_JWKS (JWKS with public key only)
```

### Step 6: Set Environment Variables

#### Web App (`apps/web/.env.local`)

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

#### Convex (`npx convex env set VAR value`)

**Required:**

| Variable                  | Value                                    |
| ------------------------- | ---------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN` | `https://your-app.clerk.accounts.dev`    |
| `ENCRYPTION_KEY`          | 64-char hex string from Step 5           |
| `EVA_DEPLOY_KEY`          | 64-char hex string from Step 5           |
| `GITHUB_APP_ID`           | App ID from GitHub App                   |
| `GITHUB_APP_SLUG`         | App slug from `github.com/apps/<slug>`   |
| `GITHUB_BOT_USER_ID`      | Numeric bot user ID (from Step 4 lookup) |
| `GITHUB_CLIENT_ID`        | Client ID from GitHub App                |
| `GITHUB_CLIENT_SECRET`    | Client secret from GitHub App            |
| `GITHUB_PRIVATE_KEY`      | Full contents of `.pem` file             |
| `GITHUB_WEBHOOK_SECRET`   | Random string from Step 4                |

**Optional:**

| Variable                  | Purpose                                |
| ------------------------- | -------------------------------------- |
| `SANDBOX_JWT_PRIVATE_KEY` | ES256 JWK for sandbox auth (JSON)      |
| `SANDBOX_JWT_JWKS`        | Public JWKS for sandbox auth (JSON)    |
| `MCP_BOOTSTRAP_SECRET`    | Secret for MCP bootstrap API           |
| `MCP_JWT_SECRET`          | Secret for MCP JWT signing             |
| `CLERK_SECRET_KEY`        | Clerk secret key (for MCP server)      |
| `CLERK_PUBLISHABLE_KEY`   | Clerk publishable key (for MCP server) |

**Git default branch (not an env var):** When a task has no `baseBranch` and the repo has no **Default base branch** (Eva **Settings → Config**), sandboxes and PRs use `staging` (`FALLBACK_GIT_BASE_BRANCH` in `@conductor/shared`). Team/repo **env vars** apply inside sandboxes only; they do not set the PR merge base.

### Step 7: Add Daytona API Key

The Daytona API key is stored as a **team or repo env var** in the dashboard (not as a Convex deployment env var).

1. Get your API key from [Daytona](https://app.daytona.io)
2. In Eva dashboard, go to **Team Settings → Environment Variables**
3. Add `DAYTONA_API_KEY` with your key

### Step 8: Run

```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Web app
pnpm dev
```

Open `http://localhost:5173`

## MCP Connections

Eva supports Convex and Supabase MCP connections. To add these, add your Convex URL and Supabase URL to the repo or team environment variables in the dashboard.

## Sandbox Snapshots

Eva runs agents inside Daytona sandboxes that boot from pre-built snapshots. Snapshots bundle the OS, system tooling, agent CLIs, your dependencies, and a clone of your repo so sandboxes start fast.

### How It Works

Eva builds snapshots itself from the backend — no GitHub Actions workflow is involved. When a build is triggered, `packages/backend/convex/snapshotActions.ts` (`buildSnapshotImage`):

1. Defines a Daytona image with all required tooling (see the list below)
2. Clones your repo at the configured branch using a GitHub installation token, then runs `pnpm install`
3. Runs any custom build commands you have configured
4. Pushes the built image to Daytona as a named snapshot, then warms Daytona's cache so the first sandbox starts fast

`DAYTONA_API_KEY` is read from your team or repo environment variables (see Step 7) — not from a GitHub Actions secret.

### Rebuilding a Snapshot

In the Eva dashboard, open your repo's **Settings → Snapshots**:

- **Configuration** — set the snapshot name, the branch to clone (**Workflow Branch**, defaults to `main`), a rebuild **Schedule** (a cron expression or `manual`), and **Build Commands** that run after `pnpm install`.
- **Status** — click **Rebuild Now** to trigger a build on demand.
- **Builds** — watch progress and read build logs.
- **Config Files** — upload files (e.g. database seeds) to bake into the image.

If a snapshot is missing or in an error state, sandbox creation falls back to a default Daytona snapshot plus a fresh `git clone`, so tasks still run (slower on first setup).

### What's In the Snapshot

- Node.js 20, pnpm, git, git-lfs, curl, jq, ripgrep, fd, gh CLI
- Chrome + Xvfb + VNC (for browser automation and desktop/preview mode)
- Docker Engine (for nested containers, e.g. `supabase start`)
- Agent CLIs: Claude Code, Codex, opencode, Cursor
- agent-browser, Convex CLI, Supabase CLI, code-server (VS Code in the browser)

To change the base tooling, edit `buildSnapshotImage()` in `packages/backend/convex/snapshotActions.ts`. For per-project needs, prefer **Build Commands** and **Config Files** in the Snapshots settings over editing the image definition.

### When to Rebuild

Rebuild your snapshot when:

- Dependencies change significantly (new major packages)
- You update the base tooling (Node.js version, system packages)
- You want sandboxes to start with a fresher copy of the codebase

## Agent Browser

Your codebase needs the `agent-browser` skill installed for screenshots or video walkthroughs to be captured.

## Authentication in Preview URLs

You may face authentication issues in the preview URL if your auth provider blocks frame ancestors (e.g. AuthKit does this for security). Options:

1. **Open in a new tab** — simplest fix.
2. **Add the Daytona domain** to your auth provider's allowlist and callback URLs, then use the preview URL directly.
3. **Implement backend auth** — if you want the iframe to work, implement a separate login page that doesn't make network requests to your auth provider (e.g. AuthKit), so it renders inside the iframe. Add instructions to your `CLAUDE.md` so the agent knows how to use this flow with `agent-browser`.

This restriction is not unique to Eva — it's a standard iframe security limitation.

## Roadmap

- Testing arena for running and comparing agent strategies
- Improved project interview UI/UX
