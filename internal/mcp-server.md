# Convex MCP Server & Research Queries

## How execute-research-query Works

The research query feature lets users ask natural language questions about their repo data (tasks, runs, sessions, projects). An AI queries the Convex database and returns analysis.

### Original Approach (local only)

- Spawns Claude Code CLI as a subprocess (`child_process.spawn`)
- CLI starts a Convex MCP server subprocess (`npx convex@latest mcp start`)
- MCP provides `runOneoffQuery` tool — Claude writes arbitrary Convex queries
- Requires `~/.convex/config.json` for auth (local login session)
- Requires `../backend` directory for MCP `--project-dir` flag

### New Approach (works on Vercel)

- Uses `ai-sdk` `generateText` with a `run_query` tool
- Tool calls Convex's `/api/run_test_function` endpoint directly via HTTP
- No subprocess spawning, no filesystem access, no MCP server
- Auth via `CONVEX_DEPLOY_KEY` (works with this endpoint)
- Requires `OPENROUTER_API_KEY` for AI model access (~$0.01-0.02/query)

## Key Discovery: Convex's run_test_function API

The Convex MCP server's `runOneoffQuery` tool internally calls:

```
POST {NEXT_PUBLIC_CONVEX_URL}/api/run_test_function
```

Request body:

```json
{
  "adminKey": "<CONVEX_DEPLOY_KEY>",
  "args": {},
  "bundle": {
    "path": "testQuery.js",
    "source": "<javascript query code>"
  },
  "format": "convex_encoded_json"
}
```

Response:

```json
{ "status": "success", "value": "<result>", "logLines": [] }
```

This is a built-in Convex platform API used by the Dashboard, CLI, and MCP server. It's read-only — mutations are rejected at the runtime level.

## Why Claude Code CLI Can't Run on Vercel

1. **MCP server needs `../backend` dir** — only `web/` is deployed to Vercel
2. **npx for MCP is unreliable** — cold starts would download `convex@latest` each time
3. **MCP auth bug** — `CONVEX_DEPLOY_KEY` fails MCP's `checkAuthorization()` (calls `HEAD /api/authorize` which returns 400 for deploy keys). The deploy key works fine with `/api/run_test_function` directly.
4. **No `~/.convex/config.json`** — MCP needs a user session token from local Convex login
5. **Timeout risk** — MCP startup + CLI startup + processing = 60-180s, tight for Vercel

## Security

- `/api/run_test_function` only executes read-only queries (Convex `query` handlers)
- `ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.delete()` don't exist in query handlers
- No network access from queries
- Prompt injection cannot cause data modification — rejected at Convex runtime level
- A guardrail agent to verify prompts is overkill since the endpoint is read-only. The only real risk is data exfiltration (querying other repos' data). Cheaper mitigation: validate the AI's generated query contains the expected `repoId` before executing.

## Human-in-the-Loop (Query Approval)

To let users see and approve queries before execution, define the tool WITHOUT an `execute` function. ai-sdk v5 supports this — no need for v6. The AI proposes a tool call but it won't run automatically.

Flow:

1. **Step 1**: AI generates query code → return to UI as "pending approval"
2. **User** sees the query → clicks approve/reject
3. **Step 2**: New Inngest event → execute the approved query → AI analyzes results → save

## How We Found /api/run_test_function

This endpoint is **not documented** in Convex's public docs. We found it by reading the Convex MCP server source code:

1. The `convex` npm package is open source — installed at `web/node_modules/convex/`
2. The MCP server lives at `convex/src/cli/mcp.ts`
3. The `runOneoffQuery` tool implementation is at `convex/src/cli/lib/mcp/tools/runOneoffQuery.ts`
4. That file (lines 72-86) makes a `POST` to `/api/run_test_function` with the admin key and a JS bundle
5. The `run.ts` tool in the same directory uses `ConvexHttpClient` for named functions

The endpoint is used internally by:

- **Convex Dashboard** — the query runner / data explorer
- **Convex CLI** — dev/debugging tools
- **Convex MCP server** — the `runOneoffQuery` tool

It's stable because Convex's own tooling depends on it, but it's undocumented so it could technically change without notice.

## Works on Prod

Yes. On Vercel, `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY` point to the production deployment. `/api/run_test_function` exists on all Convex deployments (dev and prod). As long as env vars are set on Vercel, it queries prod data.

## ai-sdk v5 Notes

- `tool()` uses `inputSchema` (not `parameters` — that was v4)
- Multi-step tool calling: `stopWhen: stepCountIs(5)` (not `maxSteps: 5`)
- Import: `import { generateText, tool, stepCountIs } from "ai"`
- Omit `execute` from a tool definition to get proposed tool calls without auto-execution (human-in-the-loop)
