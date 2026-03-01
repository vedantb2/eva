# Agent Screenshot Upload to Convex Storage

## Problem

The Claude CLI running inside the Daytona sandbox takes screenshots (e.g., of the VNC desktop via `agent-browser screenshot`), but they were only visible to the agent as local files. Users couldn't see screenshots inline in the session chat — the agent would describe what it saw in text, but the actual image was lost.

## Decisions

- **Convex file storage** for screenshots — same infrastructure as task proofs and extension releases. No external blob storage needed.
- **Auto-detection in callback script** rather than prompt-based instructions. The callback script already parses every stream-json event from Claude CLI, so we intercept image file reads and upload automatically. No agent cooperation required.
- **Public action** (`action`, not `internalAction`) because the sandbox calls via HTTP `/api/action` which only routes to public functions. Deploy key provides admin auth.
- **`imageStorageId` as optional field** on messages — no migration needed, existing messages unaffected.
- **`imageUrl` as computed field** resolved at query time via `ctx.storage.getUrl()` — not stored in the DB, always fresh.
- **Dialog-based lightbox** for viewing — click thumbnail to maximize in a 90vw×90vh dialog, with "Open in new tab" option. Uses existing `Dialog` component, no new dependencies.

## Implementation

### Backend

1. **`schema.ts`** — Added `imageStorageId: v.optional(v.id("_storage"))` to `messages` table.

2. **`messages.ts`** — Three changes:
   - `messageValidator`: Added `imageStorageId` (stored) and `imageUrl` (computed, `v.optional(v.union(v.string(), v.null()))`)
   - `listByParent` / `listByParentInternal`: Map over results, resolve `imageStorageId` → URL via `ctx.storage.getUrl()`
   - `addInternal`: Accepts optional `imageStorageId` arg, passes through to insert

3. **`screenshots.ts`** (new) — Public `upload` action:
   - Args: `sessionId` (Id<"sessions">), `imageBase64` (string)
   - Decodes base64 → Uint8Array → Blob
   - `ctx.storage.store(blob)` → storageId
   - `ctx.runMutation(internal.messages.addInternal, { parentId, role: "assistant", content: "Agent took a screenshot", imageStorageId })`

4. **`daytona.ts`** — Callback script changes:
   - Added `import { readFileSync } from "fs"`
   - Added `callAction()` helper (mirrors `callMutation` but hits `/api/action`)
   - In `parseStreamEvent`, when a `Read` tool_use targets an image file (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`): reads file from sandbox disk, base64 encodes, and fire-and-forgets `callAction("screenshots:upload", ...)`
   - Also checks `tool_result` content blocks for base64 image data (fallback for computer_use tool)

### Frontend

5. **`ChatPanel.tsx`** — `ScreenshotPreview` component:
   - Thumbnail: `max-w-sm` image with hover opacity, click opens dialog
   - Dialog: `90vw × 90vh`, image with `object-contain`, "Open in new tab" link in top-right with backdrop blur pill
   - Uses existing `Dialog` / `DialogContent` from `@conductor/ui`

## Flow

```
Sandbox: agent-browser screenshot → saves .png to disk
  → Agent uses Read tool to view the image
  → Callback script sees Read tool_use with .png path
  → readFileSync(path) → base64 encode
  → POST /api/action screenshots:upload { sessionId, imageBase64 }
  → action: decode base64 → ctx.storage.store(blob) → storageId
  → ctx.runMutation(addInternal) → message with imageStorageId
  → Chat UI: listByParent resolves imageStorageId → imageUrl
  → ScreenshotPreview renders thumbnail + click-to-expand dialog
```

## Files Touched

- `packages/backend/convex/schema.ts` (edit)
- `packages/backend/convex/messages.ts` (edit)
- `packages/backend/convex/screenshots.ts` (new)
- `packages/backend/convex/daytona.ts` (edit)
- `apps/web/app/(main)/[repo]/sessions/[id]/ChatPanel.tsx` (edit)
