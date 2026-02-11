# Plan: Add Resizable Panels to Sessions Page

## Context

The sessions `[id]` page currently uses fixed CSS widths for the sandbox (left) and chat (right) panels — `flex-1` for sandbox and `w-2/5` for chat. The user wants to make the boundary between these two panels draggable so users can resize them. The chat panel also has a collapse toggle that reduces it to `w-12`.

## Steps

### 1. Install `react-resizable-panels`

```bash
cd apps/web && pnpm add react-resizable-panels
```

### 2. Update `SessionDetailClient.tsx`

**File:** `apps/web/app/(main)/[repo]/sessions/[id]/SessionDetailClient.tsx`

Replace the current flex-based layout with `PanelGroup`, `Panel`, and `PanelResizeHandle` from `react-resizable-panels`:

- Import `PanelGroup`, `Panel`, `PanelResizeHandle` from `react-resizable-panels`
- Wrap the two panels in a `<PanelGroup direction="horizontal">`
- Left panel: `<Panel defaultSize={60} minSize={30}>` containing `SandboxPanel`
- Resize handle: `<PanelResizeHandle>` with a styled drag handle
- Right panel: `<Panel defaultSize={40} minSize={15} collapsible collapsedSize={3}>` containing `ChatPanel`
- Use the Panel API's `collapse()`/`expand()` methods (via `useRef`) to replace the `chatCollapsed` state — this integrates the existing collapse button with the resizable panel's built-in collapse support
- Remove `chatCollapsed` useState since the Panel handles this natively

### 3. Style the resize handle

Add a thin vertical drag handle between panels — a subtle `1px` border with a hover/active state for visibility. Keep it minimal to match the existing UI.

## Files to Modify

- `apps/web/package.json` — new dependency added by pnpm
- `apps/web/app/(main)/[repo]/sessions/[id]/SessionDetailClient.tsx` — replace flex layout with resizable panels

## Verification

- Run `npx tsc` in `apps/web` to type-check
- Visually verify: drag the handle between panels to resize, collapse button still works, panels respect min sizes
