# Persistent Claude Code Session

## Problem

Every user message spawns a new `npx @anthropic-ai/claude-code -p` process inside the Daytona sandbox. This means:

- Cold start overhead on every message
- No way to gracefully interrupt (Escape) — piped mode has no signal handling, a kill is a kill
- Doesn't match the real Claude Code experience where you start once and keep chatting

The `--session-id` flag gives conversation memory across invocations, but each is still a separate process.

## Current Architecture

```
User sends message
  → Convex mutation (startExecute)
  → Convex workflow (sessionExecuteWorkflow)
  → Convex action (daytona.setupAndExecute)
    → Uploads prompt to /tmp/design-prompt.txt
    → Uploads callback script to /tmp/run-design.mjs
    → Fires via nohup: `cat prompt.txt | npx claude-code -p --session-id X --output-format stream-json`
    → Callback script parses stream-json, updates streaming table, calls completion mutation
  → Workflow awaits completion event
  → Saves result to messages
```

## Desired Architecture

Claude Code starts once when the sandbox starts. User messages are sent to the running session. Escape/interrupt is possible.

## Options

### 1. Wrapper HTTP server inside sandbox

- Small Node/Express server running in the sandbox
- POST `/message` → pipes prompt to Claude Code stdin, streams back response
- POST `/cancel` → sends SIGINT to Claude process
- Web app talks to this server via sandbox preview URL
- Pros: Clean API, supports cancel, process stays alive
- Cons: Extra infra inside sandbox, need to handle process lifecycle

### 2. Run Claude Code interactively through PTY

- Already have PTY/WebSocket infra for the terminal panel
- Run `claude` (interactive mode) in a PTY
- Parse TUI output or use `--output-format stream-json` with interactive mode
- Pros: True Claude Code experience, Escape works natively
- Cons: Lose the nice chat UI (unless we parse/proxy the TUI output), complex

### 3. Keep current architecture (status quo + improvements)

- Each message is a new process, `--session-id` maintains context
- For cancel: `pkill` the process (already implemented)
- Pros: Simple, works now
- Cons: Slower, no graceful interrupt, not the ideal UX

## Claude Code CLI Constraints

- `-p` (piped) mode: one-shot, read stdin → run → exit
- No "server" or "daemon" mode exists in the CLI
- `--session-id`: persists conversation context across invocations (stored in volume at `/home/daytona/.claude`)
- Escape only works in interactive TUI mode, not piped mode
- SIGINT/SIGTERM/pkill are all equivalent in piped mode — no special handling
