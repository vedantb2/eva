# Remove `content` field, ProseMirror sync, and timeline from docs

## Files to modify

### 1. Delete `backend/convex/prosemirrorSync.ts`
Entire file is dead code.

### 2. `backend/convex/convex.config.ts`
- Remove `import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";`
- Remove `import timeline from "convex-timeline/convex.config.js";`
- Remove `app.use(prosemirrorSync);`
- Remove `app.use(timeline);`

### 3. `backend/convex/schema.ts`
- Remove `content: v.string()` from the `docs` table definition

### 4. `backend/convex/docs.ts`
- Remove `Timeline` import and `docTimeline` instance
- Remove `snapshotValidator` and `parseSnapshot`
- Remove `content` from `docValidator`, `create` args/handler, and `update` args/handler
- Remove `docTimeline.deleteScope` call from `remove` mutation
- Delete `saveVersion`, `timelineUndo`, `timelineRedo`, `timelineStatus`, `timelineHistory` entirely

### 5. `backend/package.json`
- Remove `"@convex-dev/prosemirror-sync"` and `"convex-timeline"` dependencies

### 6. `web/package.json`
- Remove `"@convex-dev/prosemirror-sync"` and `"convex-timeline"` dependencies

## No changes needed
- `web/lib/components/docs/DocViewer.tsx` — doesn't use `content`, timeline, or ProseMirror
- `web/lib/inngest/functions/evaluate-doc.ts` — uses `title`, `description`, `requirements` only
- Generated API files (`_generated/api.d.ts`, `web/api.ts`, `chrome-extension/src/api.ts`) — auto-regenerated

## Verification
- `npx tsc` in `/web` after regenerating API types
