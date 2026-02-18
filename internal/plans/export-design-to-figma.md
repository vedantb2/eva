# Export to Figma — Design Variations

## Context

Users generate AI design variations on the design page (rendered as live React via Sandpack). They want to export these into Figma as **editable design nodes** (frames, text, shapes — not screenshots). Figma's REST API is read-only for design content, so creating nodes requires the **Figma Plugin API** (runs inside Figma). This means we need two pieces: a web-side capture + storage pipeline, and a Figma plugin that imports the captured design.

## Architecture

```
User clicks "Export to Figma"
  → Render variation in hidden same-origin iframe
  → html-to-figma captures DOM → Figma node JSON
  → Store JSON in Convex (figmaExports table)

User opens Figma → runs our plugin
  → Plugin fetches pending export from our API
  → Plugin creates Figma nodes from JSON
  → Design appears as editable frames/text/shapes
```

## Phase 1: Figma OAuth (3 files)

**Env vars:** `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` (add to `apps/web/env/server.ts`)

**`apps/web/app/api/figma/authorize/route.ts`** — Redirects to Figma OAuth consent screen

- Standard OAuth 2.0 authorization code flow
- Redirect URI: `{NEXT_PUBLIC_APP_URL}/api/figma/callback`
- Scopes: `files:read` (to list projects/files for export target selection)

**`apps/web/app/api/figma/callback/route.ts`** — Exchanges code for access token

- POST to `https://www.figma.com/api/oauth/token`
- Store `access_token` + `refresh_token` + `expires_at` in Convex via mutation
- Redirect user back to design page

**`packages/backend/convex/schema.ts`** — Add to `users` table:

```
figmaAccessToken: v.optional(v.string()),
figmaRefreshToken: v.optional(v.string()),
figmaTokenExpiresAt: v.optional(v.number()),
```

**`packages/backend/convex/users.ts`** — Add mutation `setFigmaTokens({ accessToken, refreshToken, expiresAt })`

## Phase 2: Design Capture (client-side)

**Install:** `pnpm add @anthropic-ai/html-to-figma --filter=web`

Note: `@anthropic-ai/html-to-figma` is a fork of Builder.io's `html-to-figma` — converts a DOM element to Figma-compatible node JSON (frames, rectangles, text nodes with styles).

**Challenge:** Sandpack renders in a cross-origin iframe, so we can't access its DOM. Solution: render the variation's React code in a **hidden same-origin iframe** using a simple HTML page that loads the component.

**`apps/web/app/api/figma/render/route.ts`** — Serves a page that:

- Receives variation code via postMessage
- Renders it with React + Tailwind CDN (reuses the same sandpackConfig from page.tsx)
- Signals parent when render is complete
- Parent runs `htmlToFigma(iframeDocument.body)` to capture node JSON

**`apps/web/lib/hooks/useFigmaCapture.ts`** — Custom hook:

- Creates hidden iframe pointing to `/api/figma/render`
- Sends variation code via postMessage
- Waits for render-complete signal
- Runs `htmlToFigma()` on the iframe's DOM
- Returns the Figma node JSON

## Phase 3: Export Storage — Convex (2 files)

**`packages/backend/convex/schema.ts`** — New `figmaExports` table:

```
figmaExports: defineTable({
  userId: v.id("users"),
  designSessionId: v.id("designSessions"),
  variationLabel: v.string(),
  figmaNodeJson: v.string(),  // JSON.stringify'd Figma nodes
  status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  figmaFileUrl: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_user_status", ["userId", "status"])
```

**`packages/backend/convex/figmaExports.ts`** — CRUD:

- `createExport` mutation — stores captured node JSON
- `getPendingExports` query — for Figma plugin to fetch
- `markCompleted` mutation — plugin calls after creating nodes

## Phase 4: Export Button — UI (1 file)

**`apps/web/app/(main)/[repo]/design/[id]/DesignDetailClient.tsx`**

- Add "Export to Figma" button next to "Code" button (in the per-variation header)
- Flow:
  1. Check if user has Figma token → if not, open OAuth in popup window
  2. Capture DOM via `useFigmaCapture` hook
  3. Store via `createExport` mutation
  4. Show toast: "Export ready! Open Figma and run the Conductor plugin to import."

## Phase 5: Figma Plugin (separate directory)

**`apps/figma-plugin/`** — Small Figma plugin project:

- `manifest.json` — Plugin metadata, permissions
- `code.ts` — Main plugin code (runs in Figma sandbox):
  - Fetches pending exports from our API (`/api/figma/exports?userId=...`)
  - Iterates Figma node JSON, creates frames/text/rectangles using Figma Plugin API (`figma.createFrame()`, `figma.createText()`, etc.)
  - Calls `markCompleted` mutation after successful import
- `ui.html` — Simple UI showing pending exports with "Import" button
- Built with esbuild, published to Figma Community

This is a **separate build target** — doesn't affect the Next.js app. Figma plugins are distributed via the Figma Community store or shared via link.

## Phase 6: Verification

1. Connect Figma account via OAuth from design page
2. Generate a design variation
3. Click "Export to Figma" → see success toast
4. Open Figma → run Conductor plugin → click "Import"
5. Verify: editable frames with correct colors, text, layout matching the original

## Complexity Note

This is a **large feature** spanning web app + Figma plugin (separate project). Recommended build order:

1. Phases 1-4 first (web side) — can be tested with mock plugin
2. Phase 5 last (Figma plugin) — separate development/deployment cycle

Total new files: ~8-10. Estimated scope: medium-large.
