# CLAUDE.md — Chrome Extension

## Overview

**Eva Assist** — Chrome extension (Manifest V3) for capturing page elements, annotating UIs, and creating tasks linked to GitHub repos via the Conductor backend.

## Commands

```bash
pnpm dev        # Watch mode build (Vite)
pnpm build      # Production build → dist/
npx tsc         # Type check
```

## Tech Stack

- **Build**: Vite 6 with custom plugins (multi-entry: sidepanel, background, content script)
- **UI**: React 19, Radix UI primitives, Tailwind CSS 3, Tabler Icons
- **Backend**: Convex (real-time DB), Clerk (auth via `@clerk/chrome-extension`)
- **Storage**: Chrome Storage API for local preferences
- **TypeScript**: Strict mode, path alias `@/*` → `./src/*`

## Architecture

Three Chrome extension entry points:

1. **Background Service Worker** (`src/background/index.ts`) — message relay between content script and sidepanel, stores captured context state
2. **Content Script** (`src/content/index.ts`) — injects into pages, renders SelectionOverlay and AnnotationOverlay as React components inside shadow DOM
3. **Sidepanel** (`src/sidepanel/`) — main UI with Clerk auth, Convex connection, chat interface, repo selector, session management

### Key Directories

```
src/
├── background/       # Service worker
├── content/          # Content script + overlays (shadow DOM)
├── sidepanel/        # Sidepanel React app + components
├── components/ui/    # Radix-based UI primitives
├── shared/           # Message types & data models
├── lib/              # Utilities (cn)
└── styles/           # Tailwind entry CSS
```

## Patterns

- **Shadow DOM**: Content script renders React overlays in shadow DOM via `createShadowMount()` to isolate styles
- **Messaging**: Typed discriminated union messages (`src/shared/messaging.ts`) between background, content, and sidepanel
- **React Fiber Inspection**: `react-extractor.ts` reads React DevTools hook to extract component trees, props, hooks from inspected elements
- **Styling**: HSL CSS variables for theming, class-based dark mode, stored in `chrome.storage.local`
- **API Types**: Imported directly from `conductor-backend` workspace package (no code generation needed)

## Backend Integration

Connects to the same Convex backend as the web app:

- `api.githubRepos.list` — list repos
- `api.sessions.*` — session CRUD + messaging
- `api.agentTasks.createQuickTask` — create tasks from annotations

Environment variables (`VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL`) configured in `.env.*` files.

## Build Output

Vite produces `dist/` with:

- `manifest.json`, `sidepanel.html`
- `background.js` (service worker)
- `content.js` (IIFE format, no module imports)
- `assets/` (CSS, JS chunks)
- `icons/` (16/32/48/128px)
