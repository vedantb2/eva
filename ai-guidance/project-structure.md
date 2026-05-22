# Conductor (monorepo)

Platform for managing remote codebases and sandboxes (not the sandboxed app under test). **Stack**: TanStack Router + React (`apps/web`), Convex backend (`packages/backend`), shared UI (`packages/ui`), Chrome extension (`apps/chrome-extension`).

**Sandbox callback** (`packages/backend/callback-src/`): TypeScript modules bundled via esbuild into `convex/_daytona/callbackScript.generated.ts`, uploaded to sandboxes as `/tmp/run-design.mjs`. Build with `pnpm build:callback` in `packages/backend` (runs on `predeploy`).

**Session detail** (`apps/web/src/routes/_repo/$owner/$repo/sessions/`): left chat (`ChatPanel`), right sandbox tools (`SandboxPanel`) — Preview, Computer, Editor, Terminal with Daytona-backed PTYs (`packages/backend/convex/pty.ts`). Session PRD is Markdown (`sessions.planContent`); the web app edits it with Tiptap Markdown and renders with Streamdown when not editing.
