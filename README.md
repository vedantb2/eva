# Eva

> Manage coding agents inside cloud development environments connected to your repositories

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

- **Frontend**: Next.js, React, Tailwind CSS
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

## Setup

### Prerequisites

- Node.js
- pnpm
- A Convex project
- A Daytona account
- A Clerk account

### Environment Variables

| Variable            | Required | Purpose                          |
| ------------------- | -------- | -------------------------------- |
| `DAYTONA_API_KEY`   | Yes      | Sandbox creation and management  |
| `CONVEX_DEPLOY_KEY` | Yes      | Convex MCP and analysis features |

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
