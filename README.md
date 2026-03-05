# Eva

A platform for managing codebases and running them remotely in cloud sandboxes with AI-powered development workflows.

## Overview

Eva gives engineering teams a centralised hub to manage repositories, run AI-driven tasks, and collaborate on code — all in cloud sandboxes. Connect your repos, define your environment with snapshots, and let Eva handle the rest: from quick bug fixes to full feature builds, with live previews and database access baked in.

## Features

### Quick Tasks

Fix issues fast. Describe a bug or a small change, and Eva spins up an isolated sandbox to execute it. Each task runs independently — launch batches without worrying about one blocking another.

### Sessions

Cloud-hosted development environments with live previews. Use sessions as a collaborative workspace where you and the AI agent can iterate together in real-time.

### Projects

For building features end-to-end. Projects give the agent a structured workflow to plan, implement, and verify larger changes across your codebase.

### Documents

Store PRDs, specs, and context documents that the agent can reference during tasks. Keep your requirements close to the work.

### Testing

Automatically run your test suite in sandboxes. Validate changes before they land without tying up local resources.

### MCP

Access your connected databases (Convex, Supabase) directly from Claude. Query, inspect, and debug your data without leaving your AI workflow.

## How It Works

1. **Connect a repo** — Link your GitHub repository and configure environment variables.
2. **Build a snapshot** — Create a sandbox snapshot with your dependencies pre-installed (automate via GitHub Actions).
3. **Run tasks** — Launch quick tasks, sessions, or projects. Eva provisions a cloud sandbox from your snapshot, runs the AI agent, and streams results back.
4. **Review and merge** — View diffs, live previews, and test results. Merge when ready.

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
