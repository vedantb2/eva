# Inngest Worker Migration Plan

## Problem

Inngest functions run Claude CLI inside Daytona sandboxes. The CLI can take minutes to complete, but each Inngest step runs as an HTTP request to our Vercel-hosted `/api/inngest` route — bounded by Vercel's function timeout:

| Vercel Plan | Timeout                                    |
| ----------- | ------------------------------------------ |
| Hobby       | 10s                                        |
| Pro         | 60s (extendable to 300s via `maxDuration`) |
| Enterprise  | 900s                                       |

10s on Hobby is unusable for Claude CLI execution.

## Why Not Just Drop Inngest?

Daytona SDK supports async execution (`executeSessionCommand` with `runAsync: true`) — we already use this in `runClaudeCLIStreaming`. However, something still needs to **wait** for completion. Daytona has no webhooks for command completion ([open issue](https://github.com/daytonaio/daytona/issues/2513)), only for sandbox lifecycle events.

Inngest still provides value: retries, step orchestration, cron jobs (routines), observability, and concurrency control.

## Solution: Move Inngest Serve Handler to Render

Keep Inngest but host the serve handler on Render instead of Vercel. The Next.js app on Vercel only sends events via `inngest.send()` (fast, no timeout issue).

```
Vercel (Next.js) --events--> Inngest Cloud --invocations--> Render (Express/Hono server)
```

### Platform Comparison

| Platform                  | HTTP Timeout                            | Verdict                                          |
| ------------------------- | --------------------------------------- | ------------------------------------------------ |
| Vercel Hobby              | 10s                                     | Unusable                                         |
| Vercel Pro                | 300s (5 min)                            | Too short                                        |
| Railway                   | 5 min                                   | Too short                                        |
| DigitalOcean App Platform | 100s                                    | Too short                                        |
| Fly.io                    | 60s idle (configurable, resets on data) | Risky — connection drops if no data sent for 60s |
| **Render**                | **100 minutes**                         | **Works — covers 1hr Claude CLI runs**           |

### Why Render?

- **100-minute HTTP request timeout** — confirmed in Render docs, no configuration needed
- Standard Inngest `serve()` works out of the box, no experimental APIs
- Deploy timeouts are separate (build: 120min, pre-deploy: 30min, start: 15min) — these don't affect request serving
- Node.js default timeout is 2 minutes, so set `server.timeout = 0` to disable it

### Render Pricing

Free tier includes 750 hours/month. Paid starts at $7/month for always-on instances.

## Architecture

### Current (Vercel-only)

```
apps/web/app/api/inngest/route.ts  →  serve({ client: inngest, functions: [...] })
```

### Target (Vercel + Render)

```
apps/web/app/api/inngest/route.ts        →  Keep for sending events only (or remove entirely)
apps/inngest-worker/src/index.ts         →  Express/Hono server with serve()
apps/inngest-worker/package.json         →  Standalone Node.js app, deployed to Render
```

## Step-by-Step Setup

### 1. Create the Inngest Worker App

Create `apps/inngest-worker/` in the monorepo with:

- `package.json` — Express + Inngest SDK
- `src/index.ts` — Express server mounting the Inngest serve handler
- `tsconfig.json`

The worker imports all existing function definitions from `apps/web/lib/inngest/` (or we extract shared function code to a package).

### 2. Render Environment Variables

| Variable              | Value                                                      |
| --------------------- | ---------------------------------------------------------- |
| `INNGEST_SIGNING_KEY` | From Inngest dashboard                                     |
| `INNGEST_EVENT_KEY`   | From Inngest dashboard                                     |
| `INNGEST_SERVE_HOST`  | `https://<your-app>.onrender.com`                          |
| `INNGEST_SERVE_PATH`  | `/api/inngest`                                             |
| `INNGEST_STREAMING`   | `allow`                                                    |
| All other env vars    | Same as Vercel (Convex, Daytona, GitHub, Clerk keys, etc.) |

### 3. Register App with Inngest Cloud

In the Inngest dashboard, register the Render URL as your app endpoint:
`https://<your-app>.onrender.com/api/inngest`

### 4. Update Vercel

Either:

- Remove `/api/inngest` route entirely (Vercel no longer needs to serve functions)
- Or keep it but remove all function registrations (only keep `inngest.send()` calls elsewhere)

### 5. Deploy

- Deploy inngest-worker to Render (connect GitHub repo, Render auto-deploys)
- Sync with Inngest Cloud
- Test with a simple event

## Future: `connect()` API (No HTTP Timeout)

If Render's 100-min timeout ever becomes insufficient, Inngest's `connect()` API uses outbound WebSocket instead of HTTP — no timeout at all. Currently in **developer preview** (not production-ready, no SLA). Requires Node.js 22.4+ and Inngest SDK v3.34.1+.

```typescript
import { Inngest } from "inngest";
import { connect } from "inngest/connect";

const inngest = new Inngest({ id: "conductor" });

const connection = await connect({
  apps: [{ client: inngest, functions: [...] }],
});
```

## Dependency Analysis

None of the Inngest functions use Next.js APIs. The only `@/` imports are:

| Import                        | What it is                   | Size       |
| ----------------------------- | ---------------------------- | ---------- |
| `@/lib/convex-auth`           | `ConvexHttpClient` wrapper   | ~5 lines   |
| `@/env/server`                | Server env vars (t3-oss/env) | ~30 lines  |
| `@/env/client`                | Client env vars (t3-oss/env) | ~15 lines  |
| `@/lib/prompts/designPrompts` | Prompt string templates      | ~100 lines |

Everything else is relative imports within `lib/inngest/` or from `@conductor/backend`.

---

## Implementation Plan (0 → 100)

### Phase 1: Create the Worker App

**Step 1** — Create `apps/inngest-worker/` directory with:

```
apps/inngest-worker/
├── src/
│   ├── index.ts          # Express server entry point
│   └── env.ts            # Simple env validation (replaces t3-oss)
├── package.json
├── tsconfig.json
└── .env.example
```

**Step 2** — `package.json` dependencies:

```json
{
  "name": "@conductor/inngest-worker",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^5",
    "inngest": "<match current version>",
    "@daytonaio/sdk": "<match current version>",
    "@octokit/auth-app": "<match current version>",
    "convex": "<match current version>",
    "@conductor/backend": "workspace:*",
    "ai": "<match current version>",
    "@openrouter/ai-sdk-provider": "<match current version>",
    "@solvers-hub/llm-json": "<match current version>",
    "shell-quote": "<match current version>",
    "zod": "<match current version>"
  },
  "devDependencies": {
    "tsx": "latest",
    "typescript": "<match current version>",
    "@types/express": "latest"
  }
}
```

**Step 3** — `src/env.ts`: Replace t3-oss env validation with plain zod. Just validate `process.env` directly:

```typescript
import { z } from "zod";

const serverSchema = z.object({
  DAYTONA_API_KEY: z.string(),
  CLAUDE_CODE_OAUTH_TOKEN: z.string(),
  GITHUB_APP_ID: z.string(),
  GITHUB_PRIVATE_KEY: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  OPENROUTER_API_KEY: z.string(),
  CONVEX_DEPLOY_KEY: z.string(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  NEXT_PUBLIC_ENV: z.enum(["development", "production"]),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
});

export const env = serverSchema.parse(process.env);
```

**Step 4** — Copy function files from `apps/web/lib/inngest/` into `apps/inngest-worker/src/`:

```
src/
├── inngest/
│   ├── client.ts
│   ├── sandbox.ts
│   ├── index.ts
│   └── functions/
│       ├── execute-task.ts
│       ├── session-execute.ts
│       ├── session-sandbox.ts
│       ├── summarize-session.ts
│       ├── execute-research-query.ts
│       ├── evaluate-doc.ts
│       ├── cleanup-project-sandbox.ts
│       ├── interview-question.ts
│       ├── build-project.ts
│       └── design-execute.ts
├── convex-auth.ts        # Copy from apps/web/lib/convex-auth.ts
└── prompts/
    └── designPrompts.ts  # Copy from apps/web/lib/prompts/designPrompts.ts
```

**Step 5** — Update all `@/` imports in copied files to relative paths:

- `@/lib/convex-auth` → `../convex-auth`
- `@/env/server` → `../env` (unified env file)
- `@/env/client` → `../env`
- `@/lib/prompts/designPrompts` → `../prompts/designPrompts`
- `@/lib/inngest` → stays relative (already `../client`, `../sandbox`)

**Step 6** — `src/index.ts` (Express server):

```typescript
import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { /* all 12 functions */ } from "./inngest";

const app = express();
const port = process.env.PORT || 3000;

app.use("/api/inngest", serve({ client: inngest, functions: [...] }));

app.get("/health", (_, res) => res.send("ok"));

const server = app.listen(port, () => {
  console.log(`Inngest worker running on port ${port}`);
});
server.timeout = 0; // disable Node.js 2-min default timeout
```

### Phase 2: Test Locally

**Step 7** — Add to `pnpm-workspace.yaml` (if not auto-detected):

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 8** — Install dependencies:

```bash
pnpm install
```

**Step 9** — Run locally with Inngest Dev Server:

```bash
# Terminal 1: Start the worker
cd apps/inngest-worker && pnpm dev

# Terminal 2: Start Inngest Dev Server (already configured in root)
pnpm inngest
```

**Step 10** — Trigger a test event from the Inngest Dev Server dashboard (`http://localhost:8288`) and verify it hits the worker, not Vercel.

### Phase 3: Deploy to Render

**Step 11** — Go to [render.com](https://render.com) → New → **Web Service**

**Step 12** — Connect your GitHub repo. Configure:

- **Name**: `conductor-inngest-worker`
- **Region**: Pick closest to your users / Daytona region
- **Root Directory**: `apps/inngest-worker`
- **Runtime**: Node
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **Instance Type**: Starter ($7/month) or Free (spins down after inactivity — not ideal for Inngest)

**Step 13** — Add ALL environment variables in Render dashboard:

```
DAYTONA_API_KEY=...
CLAUDE_CODE_OAUTH_TOKEN=...
GITHUB_APP_ID=...
GITHUB_PRIVATE_KEY=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
OPENROUTER_API_KEY=...
CONVEX_DEPLOY_KEY=...
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
NEXT_PUBLIC_ENV=production
INNGEST_SIGNING_KEY=...
INNGEST_EVENT_KEY=...
INNGEST_SERVE_HOST=https://conductor-inngest-worker.onrender.com
INNGEST_SERVE_PATH=/api/inngest
INNGEST_STREAMING=allow
```

**Step 14** — Deploy. Verify health check at `https://conductor-inngest-worker.onrender.com/health`.

### Phase 4: Wire Up Inngest Cloud

**Step 15** — Go to [app.inngest.com](https://app.inngest.com) → Apps → Sync New App

**Step 16** — Enter the Render URL: `https://conductor-inngest-worker.onrender.com/api/inngest`

**Step 17** — Inngest Cloud will discover all 12 functions. Verify they show up in the dashboard.

### Phase 5: Update Vercel

**Step 18** — In `apps/web/app/api/inngest/route.ts`, remove the serve handler. The file can be deleted entirely — Vercel no longer serves Inngest functions.

**Step 19** — Ensure all `inngest.send()` calls in the web app still work. These send events to Inngest Cloud (not to the serve handler), so they work regardless of where the functions run.

**Step 20** — Remove the old Inngest app registration from Inngest Cloud (the Vercel URL) so functions aren't invoked on both Vercel and Render.

### Phase 6: Verify End-to-End

**Step 21** — Test each function type:

- [ ] **Session execute** — Start a session, send a message, verify Claude CLI runs
- [ ] **Start/stop sandbox** — Create and destroy a sandbox
- [ ] **Execute task** — Run a project task
- [ ] **Interview question** — Start a project interview
- [ ] **Research query** — Run an analytics query
- [ ] **Summarize session** — Trigger session summary

**Step 22** — Monitor in Inngest dashboard — all invocations should show the Render endpoint, not Vercel.

### Ongoing Maintenance

- Render auto-deploys on push to main (if connected to GitHub)
- The worker shares `@conductor/backend` via workspace — Convex schema changes are picked up automatically
- Function code lives in `apps/inngest-worker/src/inngest/` — edit there, not in `apps/web/lib/inngest/`
- After migration is stable, delete `apps/web/lib/inngest/functions/` (keep only `client.ts` for `inngest.send()` calls)
