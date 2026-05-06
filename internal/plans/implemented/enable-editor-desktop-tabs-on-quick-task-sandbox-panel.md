# Enable Editor + Desktop Tabs on Quick-Task Sandbox Panel

## Context

Quick tasks now have a multi-tab sandbox panel (Preview + Terminal). We deferred Editor (code-server, port 8080) and Desktop (NoVNC, port 6080) tabs to ship the terminal-debugging win first. Reviewers debugging a task sandbox should have the same toolkit as session users: open files in in-browser VS Code, drive a real Chrome via NoVNC, etc. Backend is already sandbox-level (no session-vs-task distinction), so this is a thin frontend wiring task.

## What's already there (reuse)

- `apps/web/src/routes/_repo/$owner/$repo/sessions/EditorPanel.tsx` — fully self-contained. Takes `sessionId` (used **only** as a `sessionStorage` cache key via `createSessionCache("editor")`), `sandboxId`, `isActive`, `repoId`. Calls `api.daytona.toggleCodeServer` + `api.daytona.getPreviewUrl` (port 8080). No session-DB access.
- `apps/web/src/routes/_repo/$owner/$repo/sessions/DesktopPanel.tsx` — same shape. Calls `api.daytona.toggleDesktopServer` + `api.daytona.launchChromeInDesktop` + `api.daytona.getPreviewUrl` (port 6080). No session-DB access.
- `apps/web/src/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar.tsx` — already accepts `enabledTabs` and filters tabs accordingly. Editor + Desktop entries already exist.
- Backend actions in `packages/backend/convex/_daytona/services.ts` (`toggleCodeServer` lines 9‑88, `toggleDesktopServer` lines 91‑131, `launchChromeInDesktop`) only need `sandboxId` + `repoId`. **No backend changes.**

## The one minor refactor

`EditorPanel` and `DesktopPanel` declare a prop named `sessionId: string` that is purely a cache-key namespace. Passing a `taskId` as `sessionId` works at the type level but is misleading. Rename the prop in both files to `cacheKey: string` (and the local variable / `editorCache`/`desktopCache` get/set/clear calls follow). Update the two call sites in `apps/web/src/routes/_repo/$owner/$repo/sessions/SandboxPanel.tsx` (lines 409, 460) to pass `cacheKey={sessionId}`. Minimum-surface, no behavior change.

## Changes to `TaskSandboxPanel.tsx`

File: `apps/web/src/lib/components/tasks/TaskSandboxPanel.tsx`

1. **Imports** — add `EditorPanel` and `DesktopPanel` from the sessions route (mirror `SandboxPanel.tsx` lines 12‑13).
2. **`TASK_ENABLED_TABS`** (line 21): `["preview", "terminal", "editor", "desktop"] as const`.
3. **Bounce-back effect** (lines 230‑234): delete. All four tabs are valid for tasks now.
4. **`tabBarValue`** (line 236): drop the narrowing — pass `activeTab` straight through, mirroring `SandboxPanel`.
5. **`handleTabChange`** (lines 314‑320): drop the early-return guard; just `void setActiveTab(tab)`.
6. **Render slots** — after the existing `terminal` block (line ~423), add two blocks rendering `<EditorPanel cacheKey={taskIdStr} sandboxId={sandboxId} isActive={isActive} repoId={repoId} />` and the matching `<DesktopPanel … />`. Mirror `SandboxPanel.tsx` lines 407‑414 and 458‑465.
7. **Update doc comment** (lines 71‑78) — currently says "only exposes the Preview and Terminal tabs (no PRD/editor/desktop)". Drop editor/desktop from the exclusion; PRD stays excluded.

## Out of scope (intentional)

- **PRD tab** — still skipped. PRD is a session-only concept (linked to session prompts).
- **Auto-start desktop on task sandbox creation** — sessions can pass `startDesktop: true` in `_daytona/sessions.ts:755`; tasks hardcode `false` at line 1124. Leaving as-is; reviewers will start desktop manually via the Start button when they need it. Cheap to revisit later.
- **Backend** — no changes. All three Daytona actions are sandbox-level.

## Critical files

- `apps/web/src/routes/_repo/$owner/$repo/sessions/EditorPanel.tsx` — rename `sessionId` → `cacheKey`.
- `apps/web/src/routes/_repo/$owner/$repo/sessions/DesktopPanel.tsx` — rename `sessionId` → `cacheKey`.
- `apps/web/src/routes/_repo/$owner/$repo/sessions/SandboxPanel.tsx` — update two call sites (lines 409, 460) to pass `cacheKey={sessionId}`.
- `apps/web/src/lib/components/tasks/TaskSandboxPanel.tsx` — enable tabs, add render slots, drop bounce effect, drop tab guard.

## Verification

1. `cd apps/web && npx tsc --noEmit` — clean.
2. Open a quick task with an active sandbox. Right panel shows all four tabs (Preview, Terminal, Editor, Desktop).
3. Editor tab: click Start Editor → spinner → code-server iframe loads on port 8080. Refresh page → cached URL restores. Stop button kills it.
4. Desktop tab: click Start Desktop → spinner → NoVNC viewer loads on port 6080 with Chrome auto-launched. Fullscreen + external-link buttons work. Stop kills it.
5. Sessions still work end-to-end (regression check: tab switching, editor, desktop on a session sandbox).
6. Stop sandbox / start sandbox cycle on a task — editor + desktop caches clear correctly when sandbox goes inactive.
