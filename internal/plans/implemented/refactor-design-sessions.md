# Refactor Design Sessions: Sandbox-Based Live Preview

## Context

Design sessions currently generate 3 UI variations as inline JSON code, rendered client-side via Sandpack. This has limitations: Sandpack doesn't support the project's actual Tailwind config/design tokens, can't use project imports, and the preview is isolated from the real codebase. The refactor switches to a persistent Daytona sandbox with a live dev server, so Claude writes actual files and the user sees real previews rendered by the project's own framework. Each design iteration becomes a git commit on a `design/{designSessionId}` branch, so design history is tracked in git.

## Approach

Keep the design route separate from sessions. Reuse shared sandbox infrastructure (`daytona.ts`) but with a design-specific sandbox lifecycle (lighter than sessions — no code-server, no terminal needed). Claude writes 3 variation files into a `/design-preview/` directory, commits after each iteration, the project's dev server serves them, and the user previews via signed iframe URLs with query params to switch between variations.

---

## Phase 1: Schema + Backend Infrastructure

### 1.1 Update variation validator (`packages/backend/convex/designSessions.ts`)

Change the variation shape to support both old (inline code) and new (file-based) formats:

```ts
const variationValidator = v.object({
  label: v.string(),
  code: v.optional(v.string()), // Legacy: Sandpack inline
  route: v.optional(v.string()), // New: e.g. "/design-preview?v=a"
  filePath: v.optional(v.string()), // New: e.g. "app/design-preview/variations/variation-a.tsx"
});
```

Add `branchName` field to `designSessions` schema (alongside existing `sandboxId`):

```ts
branchName: v.optional(v.string()),   // e.g. "design/{designSessionId}"
```

### 1.2 Add sandbox lifecycle mutations (`packages/backend/convex/designSessions.ts`)

Model after `sessions.ts` (lines 398-470). Add:

- **`startSandbox`** (public mutation) — takes `{ id, githubToken }`, schedules `internal.daytona.startDesignSandbox`
- **`stopSandbox`** (public mutation) — deletes sandbox, clears `sandboxId`, sets status `closed`
- **`sandboxReady`** (internal mutation) — called by the action when sandbox is up, stores `sandboxId` and `branchName`
- **`sandboxError`** (internal mutation) — called on failure, updates last message with error

### 1.3 Add `startDesignSandbox` action (`packages/backend/convex/daytona.ts`)

Model after `startSessionSandbox` (lines 555-639) but lighter:

- Creates or reconnects to existing sandbox (same `getOrCreateSandbox` pattern)
- Syncs the repo (`syncRepo`)
- Sets up branch: `design/{designSessionId}` (using existing `setupBranch` utility)
- Starts dev server: `pnpm dev > /dev/null 2>&1 &`
- **Does NOT** start code-server (no editor needed)
- **Does NOT** create a PTY (no terminal needed)
- Calls `designSessions.sandboxReady` on success, `designSessions.sandboxError` on failure

### 1.4 Create preview API route (`apps/web/app/api/design/preview/route.ts`)

Near-copy of `apps/web/app/api/sessions/preview/route.ts`. Differences:

- Reads from `designSessions` table (via `api.designSessions.get`)
- Same signed URL logic via `sandbox.getSignedPreviewUrl(port, 3600)`
- Returns `{ url, port, ready }` (same shape)

---

## Phase 2: Workflow + Prompt Changes

### 2.1 Update workflow (`packages/backend/convex/designWorkflow.ts`)

The workflow currently uses `setupAndExecute` which manages its own sandbox lifecycle. Change to:

1. **Step 1** (query): Same — fetch session data + build prompt. But `selectedBase` changes from `{ label, code }` to `{ label, filePath }`.
2. **Step 2** (action): Instead of `setupAndExecute`, use the **already-running persistent sandbox**. Create a new lighter action `executeOnSandbox` (or reuse `launchScript` pattern from `launchAudit` at daytona.ts:514-538) that:
   - Takes existing `sandboxId` (required, no creation)
   - Uploads prompt to `/tmp/design-prompt.txt`
   - Builds callback script via `buildCallbackScript`
   - Launches via `nohup`
3. **Step 3** (await): Same — `awaitEvent("designComplete")`
4. **Step 4** (mutation): `saveResult` parses new JSON shape: `{ summary, variations: [{ label, route, filePath }] }`

### 2.2 Update prompt (`designWorkflow.ts`)

**New `DESIGN_SYSTEM_PROMPT`:**

```
You MUST write 3 React component variation files and commit them, then output ONLY valid JSON:
{
  "summary": "Brief design decisions",
  "variations": [
    { "label": "Design A - [descriptor]", "route": "/design-preview?v=a", "filePath": "[path you wrote]" },
    { "label": "Design B - [descriptor]", "route": "/design-preview?v=b", "filePath": "[path you wrote]" },
    { "label": "Design C - [descriptor]", "route": "/design-preview?v=c", "filePath": "[path you wrote]" }
  ]
}
```

**New `buildDesignPrompt` steps:**

1-6 remain the same (load skills, read CLAUDE.md, Tailwind config, existing components) 7. Check if `/design-preview/` scaffold exists. If not, create the router page (framework-aware: Next.js `app/design-preview/page.tsx` or Vite equivalent) that lazy-imports `variations/variation-{a,b,c}.tsx` based on `?v=` query param 8. Write 3 variation files to `design-preview/variations/` 9. Commit all changes with a descriptive message: `design: [user's request summary]` 10. Push to the `design/{designSessionId}` branch 11. Output JSON

**Allowed tools change:** `"Read,Glob,Grep,Skill"` → `"Read,Glob,Grep,Skill,Write,Edit,Bash"`

**Base selection context change:**

```
The user selected "${selectedBase.label}" as the base.
Read the file at: ${selectedBase.filePath}
Create 3 refined variations of THIS design.
```

### 2.3 Router scaffold (written by Claude on first run)

For Next.js projects, Claude creates `app/design-preview/page.tsx`:

```tsx
"use client";
import { lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const variations = {
  a: lazy(() => import("./variations/variation-a")),
  b: lazy(() => import("./variations/variation-b")),
  c: lazy(() => import("./variations/variation-c")),
};

export default function DesignPreview() {
  const params = useSearchParams();
  const v = params.get("v") || "a";
  const Component = variations[v] || variations.a;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  );
}
```

This is part of the prompt instructions, not hardcoded in the backend.

---

## Phase 3: Frontend Changes

### 3.1 Sandbox lifecycle in `DesignDetailClient.tsx`

**Hybrid start approach:**

- **New session (no messages)**: Auto-start sandbox when user sends first message. The `handleSend` function calls `startSandbox`, waits for `sandboxReady`, then calls `executeMessage`.
- **Returning to existing session (has messages, no sandbox)**: Show a "Start sandbox" button in the preview panel area. User clicks to reconnect. Once running, they can send new messages.
- **Sandbox already running**: Just works, user can send messages immediately.

Show sandbox status indicator (starting / running / stopped) in the preview panel header.

### 3.2 Replace Sandpack with iframe preview

Replace the `SandpackProvider`/`SandpackPreview` block (lines 371-413) with an iframe:

```tsx
<iframe
  src={`${previewUrl}/design-preview?v=${["a", "b", "c"][i]}`}
  className="w-full h-full border-0"
/>
```

Fetch `previewUrl` from `/api/design/preview?designSessionId=...&port=3000`.

### 3.3 Variation tab switching

Same tab structure as current (Design A / B / C tabs). Switching tabs changes the iframe `src` query param. The dev server (already running) serves the page which lazy-loads the correct variation file.

### 3.4 Desktop/mobile toggle

Same as current — changes iframe container dimensions.

### 3.5 Remove "View Code" button

Since each iteration is a git commit on `design/{designSessionId}`, users can view the code via git. Remove the "View Code" dialog entirely.

### 3.6 Backward compatibility

For old messages with `variation.code` but no `variation.route`: render via Sandpack (existing code path). For new messages with `variation.route`: render via iframe. Check which field exists to decide.

### 3.7 Remove Sandpack dependency (later)

Once all old sessions are archived, remove `@codesandbox/sandpack-react` and the Sandpack config logic from `page.tsx`.

---

## Phase 4: Polish

- Loading states for sandbox startup (spinner while waiting for `sandboxReady`)
- Error handling for sandbox failures
- "Reconnecting..." state if sandbox goes stale
- Add `.gitignore` entry for `design-preview/` in prompt instructions (so it doesn't pollute the main branch if accidentally merged — or leave it up to the user since it's on a design branch)

---

## Files to Modify

| File                                                            | Change                                                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/convex/designSessions.ts`                     | Update validator, add `branchName` field, add sandbox lifecycle mutations                                                                |
| `packages/backend/convex/designWorkflow.ts`                     | Update workflow to use persistent sandbox, update prompt for file writing + git commits, update `saveResult` + `getSessionDataAndPrompt` |
| `packages/backend/convex/daytona.ts`                            | Add `startDesignSandbox` action                                                                                                          |
| `packages/backend/convex/schema.ts`                             | Add `branchName` to `designSessions`, update variation field shape                                                                       |
| `apps/web/app/(main)/[repo]/design/[id]/DesignDetailClient.tsx` | Replace Sandpack with iframe, add sandbox lifecycle controls, remove View Code dialog                                                    |
| `apps/web/app/(main)/[repo]/design/[id]/page.tsx`               | Keep Sandpack config for backward compat (remove later)                                                                                  |
| `apps/web/app/api/design/preview/route.ts`                      | **New** — preview URL API route                                                                                                          |

## Reused Utilities

- `getOrCreateSandbox` / `createSandbox` / `syncRepo` / `setupBranch` from `daytona.ts`
- `buildCallbackScript` / `launchScript` from `daytona.ts`
- `getSignedPreviewUrl` pattern from `sessions/preview/route.ts`
- `getWorkflowTokens` from `apps/web/app/(main)/[repo]/actions.ts`
- `streaming:set` / `streaming:get` for real-time activity (unchanged)

## Verification

1. Start a design session, verify sandbox spins up on `design/{id}` branch and dev server starts
2. Send a design prompt, verify Claude writes 3 variation files + router scaffold + commits
3. Verify iframe previews load at `/design-preview?v=a`, `?v=b`, `?v=c`
4. Switch between Design A/B/C tabs, verify iframe updates
5. Toggle desktop/mobile, verify sizing changes
6. Click "Use this design", send another message, verify Claude refines the selected variation and commits again
7. Verify git log on `design/{id}` branch shows one commit per iteration
8. Close session, reopen, click "Start sandbox", verify reconnects and previews work
9. Test with an existing old session (Sandpack backward compat still works)
10. Run `npx tsc` in `apps/web` — no type errors
11. Run `npx convex dev` in `packages/backend` — schema validates
