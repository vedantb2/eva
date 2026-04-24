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
AI Agent (Claude)
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

| App                     | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `apps/web`              | Main dashboard for managing repos, tasks, and sessions    |
| `apps/desktop`          | Electron desktop client with local session persistence    |
| `apps/mcp`              | MCP server for Claude to query connected Convex databases |
| `apps/chrome-extension` | Browser extension for quick task execution                |
| `apps/teams-bot`        | Microsoft Teams integration                               |
| `apps/mobile`           | React Native mobile client                                |

## Self-Hosting

Eva is self-hosted — there is no managed cloud version. You create your own Convex deployment, set up your own Clerk project, and run the app yourself. This gives you full control over your data and infrastructure.

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
git clone https://github.com/your-org/conductor.git
cd conductor
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
VITE_ENV=development
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

| Variable                  | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `ENVIRONMENT`             | Set to `production` to disable public sign-ups |
| `SANDBOX_JWT_PRIVATE_KEY` | ES256 JWK for sandbox auth (JSON)              |
| `SANDBOX_JWT_JWKS`        | Public JWKS for sandbox auth (JSON)            |
| `MCP_BOOTSTRAP_SECRET`    | Secret for MCP bootstrap API                   |
| `MCP_JWT_SECRET`          | Secret for MCP JWT signing                     |
| `CLERK_SECRET_KEY`        | Clerk secret key (for MCP server)              |
| `CLERK_PUBLISHABLE_KEY`   | Clerk publishable key (for MCP server)         |

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

Eva runs agents inside Daytona sandboxes that boot from pre-built snapshots. Snapshots include the OS, dependencies, tooling, and your repo code so sandboxes start fast.

### How It Works

The repo includes a GitHub Actions workflow (`.github/workflows/rebuild-snapshot.yml`) that:

1. Generates a Dockerfile with all required system dependencies (Node.js, Chrome, ripgrep, Claude Code, agent-browser, etc.)
2. Copies your repo into the image and runs `pnpm install`
3. Pushes the built image to Daytona as a named snapshot

### Running the Workflow

1. Go to your repo's **Actions** tab on GitHub
2. Select **Rebuild Daytona Snapshot** from the workflow list
3. Click **Run workflow**
4. Enter a **snapshot name** (this is the name you'll reference in Eva when configuring a repo)
5. The workflow requires `DAYTONA_API_KEY` to be set as a GitHub Actions secret

### Customizing the Snapshot

Edit `.github/workflows/rebuild-snapshot.yml` to customize what gets installed. The default snapshot includes:

- Node.js 20, pnpm, git, curl, jq, ripgrep, fd, gh CLI
- Chrome + Xvfb + VNC (for browser automation and previews)
- Claude Code, agent-browser, Convex CLI
- code-server (VS Code in the browser)

If your project needs additional system packages, language runtimes, or global tools, add them to the Dockerfile generation step in the workflow.

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

- Codex agent support
- Testing arena for running and comparing agent strategies
- Improved project interview UI/UX
