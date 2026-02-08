# Sandbox Approach: Research Queries via Claude Code CLI + Daytona

## Overview

Use Claude Code CLI inside a Daytona sandbox to query Convex via `/api/run_test_function`. This avoids API costs by using `CLAUDE_CODE_OAUTH_TOKEN` (Claude Max subscription) instead of paid API keys.

## Why This Works

Now that we know `/api/run_test_function` exists, we don't need the Convex MCP server at all. We just need Claude Code CLI + Bash to curl the endpoint directly. Daytona gives us a reliable, sandboxed environment that works from Vercel.

- No MCP server subprocess needed
- No `../backend` dir needed
- No `~/.convex/config.json` needed
- No MCP auth bug (deploy key works directly with the endpoint)
- `execute-task` already proves Claude Code CLI works in Daytona

## Flow

1. Inngest function triggers (`research/query.execute` event)
2. Create ephemeral Daytona sandbox (or reuse project sandbox if available)
3. Run Claude Code CLI in sandbox with `allowedTools: ["Bash"]`
4. System prompt tells Claude to use curl to query `/api/run_test_function`
5. Claude writes Convex queries, executes via curl, analyzes results
6. Return result, save to Convex

## Implementation

Modify `web/lib/inngest/functions/execute-research-query.ts`:

```typescript
import { createSandbox, runClaudeCLI } from "../sandbox";

// In the "generate-answer" step:
const githubToken = await getGitHubToken(installationId);
const sandbox = await createSandbox(githubToken, true); // ephemeral

const prompt = `You are a data analyst. Query the Convex database using bash curl commands.

## How to Query
Run this curl command (replace the query code inside "source"):
\`\`\`bash
curl -s -X POST "${CONVEX_URL}/api/run_test_function" \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "${DEPLOY_KEY}",
    "args": {},
    "bundle": {"path": "testQuery.js", "source": "<YOUR QUERY CODE>"},
    "format": "convex_encoded_json"
  }'
\`\`\`

## Query Code Format
import { query } from "convex:/_system/repl/wrappers.js";
export default query({ handler: async (ctx) => {
  return await ctx.db.query("tableName").collect();
}});

## Current Time: ${new Date().toISOString()} (${Date.now()} ms)
## Repository ID: ${repoId}
## Question: ${question}

[schema + instructions same as current]`;

const result = await runClaudeCLI(sandbox, prompt, {
  model: "sonnet",
  allowedTools: ["Bash"],
  timeout: 120,
});
```

## Pros

- **Free** — uses `CLAUDE_CODE_OAUTH_TOKEN` (Claude Max subscription)
- **Works on Vercel** — Daytona is cloud-based, only HTTP calls from serverless
- **Proven pattern** — `execute-task` already does exactly this
- **Sandboxed** — ephemeral Daytona sandbox isolates execution
- **Same query power** — arbitrary Convex queries via `/api/run_test_function`

## Cons

- **Sandbox overhead** — ~15-30s to create (mitigate by reusing project sandbox)
- **Daytona dependency** — if Daytona is down, research queries fail
- **Bash access** — Claude has full Bash in the sandbox (but it's ephemeral/isolated so damage is contained)

## Optimizations

- **Reuse project sandbox**: If the repo already has a running sandbox (from sessions/tasks), reuse it instead of creating a new one
- **Snapshot with Claude Code pre-installed**: The `eva-snapshot` already has npm/npx, so `npx @anthropic-ai/claude-code` works without download delay
- **Network allow-list**: Restrict sandbox network to only Convex URL + Anthropic API for extra security
