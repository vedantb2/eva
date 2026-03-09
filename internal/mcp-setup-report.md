# MCP Setup

**Updated:** 2026-03-09

## Linear

Official remote MCP with Bearer token auth (no OAuth needed).

```bash
claude mcp remove linear
claude mcp add --transport http linear https://mcp.linear.app/mcp \
  --header "Authorization: Bearer lin_api_XXXXXXXXXXXX"
```

Get API key: **Linear > Settings > Account > Security & Access > API Keys**

**Fallback** if auth header is ignored ([known bug](https://github.com/anthropics/claude-code/issues/7290)):

```bash
npm install -g @emmett.deen/linear-mcp-server
claude mcp add linear-alt -- linear-mcp-server --token YOUR_LINEAR_API_TOKEN
```

## Figma

[`figma-developer-mcp`](https://github.com/GLips/Figma-Context-MCP) — 13.5k stars, 139k monthly downloads, actively maintained. Extracts layout/styling data optimized for code generation. PAT auth via env var.

Named `figma-dev` to coexist with the official `figma` OAuth MCP (used locally). In `-p` headless mode, only `figma-dev` works since OAuth can't complete.

```bash
claude mcp add-json figma-dev '{
  "command": "npx",
  "args": ["-y", "figma-developer-mcp", "--stdio"],
  "env": {
    "FIGMA_API_KEY": "figd_XXXXXXXXXXXX"
  }
}'
```

Get PAT: **Figma > Account Settings > Personal Access Tokens**

## Sentry

[`@sentry/mcp-server`](https://github.com/getsentry/sentry-mcp) — official, ~580 stars. Stdio with access token.

```bash
claude mcp add sentry -- npx @sentry/mcp-server --access-token sntryu_XXXXXXXXXXXX
```

Get token: **Sentry > Settings > Auth Tokens** (scopes: `org:read`, `project:read`, `project:write`, `team:read`, `event:write`)

## Supabase

[`@supabase/mcp-server-supabase`](https://github.com/supabase-community/supabase-mcp) — official, ~2.4k stars. Stdio with PAT.

**Important:** Name it `supabase-db`, not `supabase` — [naming bug](https://github.com/anthropics/claude-code/issues/21368) forces OAuth otherwise.

```bash
claude mcp add supabase-db -- npx -y @supabase/mcp-server-supabase@latest --access-token sbp_XXXXXXXXXXXX
```

Get PAT: **[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)**

## PostHog

No native stdio server. Requires [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) to bridge their SSE endpoint.

```bash
claude mcp add posthog -- npx mcp-remote@latest "https://mcp.posthog.com/sse" \
  --header "Authorization:Bearer phx_XXXXXXXXXXXX"
```

Get key: **PostHog > Settings > Personal API Keys** (use "MCP Server" preset)

**Note:** Does not work on PostHog EU cloud (`eu.posthog.com`).

## Headless Mode (`-p`)

MCP servers configured via `claude mcp add` persist in `~/.claude.json` and are available in `-p` mode automatically. No extra flags needed.

## Verify

Run `/mcp` in interactive mode to confirm servers are connected.
