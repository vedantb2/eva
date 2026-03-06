# MCP Setup Report: Figma & Linear

**Date:** 2026-03-06

## Current State

Both MCP servers have been registered in Claude Code's project config (`~/.claude.json`):

```json
"mcpServers": {
  "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" },
  "linear": { "type": "http", "url": "https://mcp.linear.app/mcp" }
}
```

**Neither is functional yet.** Both require OAuth authentication, which cannot complete in a headless/CI environment.

---

## Issue 1: Linear MCP — Needs Auth Header

**Status:** Fixable without OAuth

Linear's official MCP server supports Bearer token auth via the `Authorization` header. This bypasses the OAuth flow entirely.

### Fix

1. Get your Linear API key from **Linear > Settings > Account > Security & Access > API Keys**
2. Remove the current config and re-add with the auth header:

```bash
claude mcp remove linear
claude mcp add --transport http linear https://mcp.linear.app/mcp \
  --header "Authorization: Bearer lin_api_XXXXXXXXXXXX"
```

3. Restart Claude Code. Verify with `/mcp`.

### Known Issue

There is a [reported bug](https://github.com/anthropics/claude-code/issues/7290) where some Claude Code versions ignore auth headers and force OAuth discovery. If the above doesn't work, the workaround is using a stdio-based community server:

```bash
npm install -g @emmett.deen/linear-mcp-server
claude mcp add linear-alt -- linear-mcp-server --token YOUR_LINEAR_API_TOKEN
```

---

## Issue 2: Figma MCP — OAuth Only (No PAT Support)

**Status:** Cannot use API key with official server

Figma's remote MCP (`mcp.figma.com`) **does not support personal access tokens**. Auth headers like `Authorization: Bearer` or `X-Figma-Token` are rejected. OAuth is the only auth method.

### Option A: Interactive OAuth (Recommended)

If running Claude Code locally (not headless):

1. Open Claude Code in terminal
2. Type `/mcp`, select `figma`, then "Authenticate"
3. Complete the OAuth flow in browser
4. Verify with `/mcp`

### Option B: Third-Party Figma MCP with PAT (Headless Compatible)

Use a community Figma MCP server that accepts a personal access token:

```bash
# Install
npx -y @anthropic-ai/create-mcp

# Or use smithery-ai/mcp-figma
claude mcp remove figma
claude mcp add-json figma '{
  "command": "npx",
  "args": ["-y", "mcp-figma"],
  "env": {
    "FIGMA_API_TOKEN": "figd_XXXXXXXXXXXX"
  }
}'
```

Generate the PAT at: **Figma > Account Settings > Personal Access Tokens**

**Trade-off:** Third-party servers don't support Figma's newer features (code-to-Figma push, two-way sync). They only provide read access to files, components, and styles.

### Option C: Desktop Figma MCP (Local Only)

If Figma desktop app is installed:

```bash
claude mcp remove figma
claude mcp add --transport http figma http://127.0.0.1:3845/mcp
```

---

## Where to Put API Keys

The API keys should NOT go in `.env` files or be committed to the repo. They are configured directly in the Claude Code MCP config:

- **Linear:** Pass via `--header "Authorization: Bearer ..."` when adding the server
- **Figma:** Either complete OAuth interactively, or use a third-party server with the key in `env` config

---

## Recommended Next Steps

1. **Linear:** Re-add with `--header` flag using your API key (see fix above)
2. **Figma:** Complete OAuth flow locally, OR switch to third-party server if headless access is needed
3. After setup, restart Claude Code and verify both with `/mcp`

---

## Sources

- [Figma MCP Remote Server Setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Figma PAT Not Supported](https://forum.figma.com/ask-the-community-7/support-for-pat-personal-access-token-based-auth-in-figma-remote-mcp-47465)
- [Linear MCP Server Docs](https://linear.app/docs/mcp)
- [Claude Code MCP Configuration](https://code.claude.com/docs/en/mcp)
- [Claude Code Header Bug](https://github.com/anthropics/claude-code/issues/7290)
