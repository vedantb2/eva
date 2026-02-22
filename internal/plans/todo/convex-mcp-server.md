# Convex MCP Server — Replace Analyse Page

## Decision (2026-02-19)

**Kill the Analyse page** as a conversational query interface. Replace it with an MCP server that Claude Coworker/Desktop/Code can connect to.

### Reasoning

- The Analyse page is a thin wrapper around "Claude writes and runs a DB query" — Claude Coworker + an MCP server does this better with zero custom UI to maintain.
- Claude Coworker will have better data analysis, visualization, export, and context handling within 6 months. Competing on "ask a question, get data back" is a losing game.
- An MCP server is a few hundred lines of code vs the entire Analyse page + workflow + sandbox setup.
- Works across Claude Desktop, Claude Code, and Coworker — not locked to the web app.

### What we lose

- **Routines/scheduled queries** — build these as a standalone lightweight feature if needed (cron job, not AI chat).
- **Web-only access** — users need Claude Desktop/Coworker set up.

### What the Analyse page should become (if anything)

Pre-built, opinionated dashboards with always-visible metrics. Push-based (scheduled reports, Slack digests), not pull-based. Actionable results with deep product integration (e.g., "12 tasks blocked — click to unblock"). Things Claude Coworker can't do because it only answers when asked.
