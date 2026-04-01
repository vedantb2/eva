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

- Node.js
- pnpm
- A Convex project
- A Daytona account
- A Clerk account

### Environment Variables

#### Web App (`apps/web`)

| Variable                     | Required | Purpose                                   |
| ---------------------------- | -------- | ----------------------------------------- |
| `VITE_CONVEX_URL`            | Yes      | Your Convex deployment URL                |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes      | Clerk publishable key                     |
| `VITE_ENV`                   | Yes      | `development`, `staging`, or `production` |

#### Convex (set in Convex dashboard or `npx convex env set`)

| Variable                  | Required | Purpose                                 |
| ------------------------- | -------- | --------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes      | Clerk JWT issuer for auth               |
| `ENCRYPTION_KEY`          | Yes      | Encryption key for sensitive data       |
| `EVA_DEPLOY_KEY`          | Yes      | Deploy key for Eva operations           |
| `DAYTONA_API_KEY`         | Yes      | Sandbox creation and management         |
| `GITHUB_APP_ID`           | Yes      | GitHub App ID for repo access           |
| `GITHUB_CLIENT_ID`        | Yes      | GitHub OAuth client ID                  |
| `GITHUB_CLIENT_SECRET`    | Yes      | GitHub OAuth client secret              |
| `GITHUB_PRIVATE_KEY`      | Yes      | GitHub App private key                  |
| `GITHUB_WEBHOOK_SECRET`   | Yes      | GitHub webhook signature verification   |
| `ENVIRONMENT`             | No       | Set to `production` to disable sign-ups |

Add any repo-specific env vars through the repo/team settings in the dashboard.

### Install and Run

```bash
pnpm install
npx convex dev
pnpm dev
```

## MCP Connections

Eva supports Convex and Supabase MCP connections. To add these, add your Convex URL and Supabase URL to the repo or team environment variables in the dashboard.

## Sandbox Snapshots

You need to create a workflow to build your snapshot — this is an implementation detail specific to your codebase. You can use GitHub Actions to automate snapshot creation (e.g. per commit to main, or on a daily schedule). Maximise the resources you allocate so the sandboxes have what they need for sessions.

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
