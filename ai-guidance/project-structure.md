# Conductor (monorepo)

Platform for managing remote codebases and sandboxes (not the sandboxed app under test). **Stack**: TanStack Router + React (`apps/web`), Convex backend (`packages/backend`), shared UI (`packages/ui`), desktop Electron app (`apps/desktop`).

**Session detail** (`apps/web/src/routes/_repo/$owner/$repo/sessions/`): left chat (`ChatPanel`), right sandbox tools (`SandboxPanel`) — Preview, Computer, Editor, Terminal with Daytona-backed PTYs (`packages/backend/convex/pty.ts`).
