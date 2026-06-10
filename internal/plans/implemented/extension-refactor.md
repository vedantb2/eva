# Chrome Extension Refactor: Remove Side Panel, Toolbar-First

## Context

The extension (`apps/chrome-extension`) currently opens a side panel on icon click. The panel hosts the Clerk auth + Convex client and is the executor for everything: creating tasks from annotation pins, loading/saving pins, Run All, Add to Project, status sync, plus chat/sessions. The content-script toolbar/overlays are dumb views messaging through a 3-hop chain (content → background → panel).

**Goal:** delete the side panel. Icon click toggles the in-page toolbar per tab. Toolbar gains Annotate + Inspect mode buttons. Inspect captures element info (selector, React tree, HTML) and copies it to the clipboard as markdown. All backend logic (Clerk + Convex) moves into the background service worker. Chat/sessions deleted entirely (live in web app only).

**Decisions made with user:** background hosts Clerk+Convex (full task functionality kept) · inspect copies markdown to clipboard · icon click = per-tab toggle · toolbar buttons: Annotate, Inspect, Run All, Add to Project · chat/sessions deleted · repo resolved by domain match, error if none.

## Verified critical facts

- `packages/backend/convex/auth.config.ts` uses `applicationID: "convex"` → background MUST call `clerk.session?.getToken({ template: "convex" })`. Bare `getToken()` fails opaquely.
- `createClerkClient` (@clerk/chrome-extension/background, v2.8.20) supports `syncHost` — pass `VITE_EVA_URL` so background inherits the web-app session (verified in node_modules types).
- `chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})` persists in the browser profile; removing `side_panel` from manifest + extension reload resets it so `chrome.action.onClicked` fires.
- `TOOLBAR_ADD_QUICK_TASKS` is dead code (no button calls it) — delete, don't port.
- Two description builders exist: bulk one in `App.tsx:215-220` (Run All / project), rich one in `ChatPanel.tsx:231-253` (single pin task, includes React tree/outerHTML). Port both.

## Files

| Action    | Paths                                                                                                                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delete    | `src/sidepanel/` (all), `sidepanel.html`                                                                                                                                                                                                        |
| Create    | `src/background/convex.ts`, `src/background/repo-matching.ts`, `src/background/handlers.ts`, `src/shared/task-description.ts`, `src/content/toolbar-state.ts`, `src/content/inspect-markdown.ts`, `src/content/ProjectModal.tsx`                |
| Modify    | `src/background/index.ts`, `src/content/index.ts`, `src/content/PageToolbar.tsx`, `src/content/AnnotationOverlay.tsx`, `src/content/SelectionOverlay.tsx` (minor), `src/shared/messaging.ts`, `manifest.json`, `vite.config.ts`, `package.json` |
| Untouched | `packages/backend/**` (drop usage of `api.auth.get/setToolbarVisible` but leave functions), `react-extractor.ts`, `shadow-root.tsx`, `theme.ts`                                                                                                 |

## 1. New message protocol (`src/shared/messaging.ts` rewrite)

3-hop forwarding collapses to content → background request/response. Keep `StoredPin`, `TaskStatus`, `EVA_URL`, `isRepoId`/`isTaskId`; drop `isSessionId` and all 22 old message types (`START_SELECTION`, `ELEMENT_CAPTURED`, `PANEL_CLOSED`, `SHOW_TOOLBAR`, etc. — annotate/inspect start/stop become local function calls in the content script).

```ts
type BgErrorCode = "not_signed_in" | "no_repo_match" | "convex_error";
type BgError = { ok: false; code: BgErrorCode; message: string };
type BgResult<T> = ({ ok: true } & T) | BgError;
```

Requests (content → background):

- `GET_TOOLBAR_VISIBILITY` → `{ visible: boolean }` (background uses `sender.tab.id`)
- `LOAD_ANNOTATIONS { pageUrl }` → `BgResult<{ pins: Record<string, StoredPin> }>`
- `SAVE_ANNOTATIONS { pageUrl, pins }` → `BgResult<{}>` (empty pins → `annotations.remove`)
- `CREATE_ANNOTATION_TASK { pageUrl, title, pinId, elementContext? }` → `BgResult<{ pinId, taskId, userId?, creatorInitials }>`
- `RUN_ANNOTATION_TASK { taskId }` → `BgResult<{}>`
- `RUN_ALL_ANNOTATIONS { pageUrl, pins }` → `BgResult<{ created: {pinId, taskId}[], userId?, creatorInitials, message }>`
- `LIST_PROJECTS { pageUrl }` → `BgResult<{ projects: {id, title, phase}[] }>`
- `ADD_TO_PROJECT { pageUrl, pins, target: {kind:"existing", projectId} | {kind:"new", title} }` → `BgResult<{ count, message }>`
- `SYNC_TASK_STATUSES { taskIds }` → `BgResult<{ updates: Record<taskId, TaskStatus> }>`
- `OPEN_EVA { path? }` → `{ ok: true }` (background `chrome.tabs.create`)

Push (background → content): `TOOLBAR_VISIBILITY_CHANGED { visible }` on icon toggle.

Typed wrapper `requestBackground<K extends keyof BgRequestMap>(type, payload)` with a request map interface; validate responses with runtime guards (port `isRecord`/`isStoredPinRecord` from `App.tsx:84-104`) — no `any`/`as`.

## 2. Background

**`convex.ts`**: memoised `createClerkClient({ publishableKey, syncHost: VITE_EVA_URL })` (eager init at SW start, lazy re-init after wake); singleton `ConvexHttpClient(VITE_CONVEX_URL)`; `getAuthedClient()` fetches fresh `getToken({ template: "convex" })` per request (sidesteps ~60s JWT expiry + SW restarts), throws `NotSignedInError` when no session; `withAuth(fn)` wrapper maps errors → typed `BgError`.

**`repo-matching.ts`**: port verbatim from `App.tsx` — `getHostFromUrl` (56-62), `domainMatches` (64-66), longest-match-wins (68-82), domain map building with `new URL(raw.includes("://") ? raw : "https://"+raw).hostname` (113-130). `resolveRepoForUrl(client, pageUrl)` queries `api.githubRepos.list`, throws `NoRepoMatchError` if no match.

**`task-description.ts` (shared)**: `buildPinDescription` (port `App.tsx:215-220`), `buildContextDescription` (port `ChatPanel.tsx:231-253` — React tree `<details>` / outerHTML block).

**`handlers.ts`**: one async function per request type:

- `loadAnnotations`/`saveAnnotations` → `api.annotations.getByUrl/save/remove` (JSON parse guard from `AnnotationTool.tsx:69-71`)
- `createAnnotationTask` → resolve repo → `buildContextDescription` → `api.agentTasks.createQuickTask` → `api.auth.me` + initials from `clerk.user` (port `App.tsx:176-178`)
- `runAnnotationTask` → `api.agentTasks.startExecution`
- `runAllAnnotations` → resolve repo once; per pin: `createQuickTask` (title `pin.text.slice(0,100) || "Annotation #N"`, `buildPinDescription`) then `startExecution`; per-pin try/catch as today; return `created` list
- `listProjects` → resolve repo → `api.projects.list`
- `addToProject` → resolve repo; create tasks per pin; then `api.agentTasks.assignToProject` or `api.projects.createFromTasks` (port `App.tsx:305-360`)
- `syncTaskStatuses` → `api.agentTasks.getStatusesByIds` → `Record<taskId, status>`
- `openEva` → `chrome.tabs.create({ url: EVA_URL + path })`

**`index.ts` rewrite**: remove `chrome.sidePanel.*`, `"sidepanel"` port listener, `capturedContext`, forwarding. Add:

- Icon toggle: read/flip `toolbarVisible:<tabId>` in `chrome.storage.session`, send `TOOLBAR_VISIBILITY_CHANGED`; if `tabs.sendMessage` fails (chrome:// page), revert the flip.
- `chrome.tabs.onRemoved` → remove the key.
- Message router: validate `message.type`, dispatch to handler, `return true`, respond via `sendResponse` with `withAuth`-wrapped results (errors never thrown).

No keepalive needed — every content interaction is a message that wakes the SW.

## 3. Content

**`toolbar-state.ts` (new)**: extract module-level store from `PageToolbar.tsx:12-56` (`showToolbar`/`hideToolbar`/`setToolbarFeedback`/drag pos) and extend with `mode: "annotate" | "inspect" | null`, `projectModalOpen`, `signedOut`. `setMode` is mutually exclusive: activates/deactivates `AnnotationOverlay` or the inspect controller (registered via `registerInspectController({start, stop})` from `index.ts`). `hideToolbar()` resets mode + closes modal.

**`PageToolbar.tsx`**: add Annotate + Inspect toggle buttons (active = ring treatment like old side-panel tool buttons); keep pin counter, eye toggle, Run All, Add to Project, drag, feedback. Buttons now `await requestBackground(...)`; map error codes → feedback (`not_signed_in` → clickable "Sign in to Eva" → `OPEN_EVA`; `no_repo_match` → "No repo mapped to this domain — configure domains in Eva"). "Add all to a Project" opens the in-page modal instead of messaging.

**`AnnotationOverlay.tsx`**: remove its `chrome.runtime.onMessage` effect (1118-1179); expose `notifyTasksCreated(items, userId?, initials?)` and `applyTaskStatuses(updates)` as module functions (same `_ext` store-emitter style already in the file) replacing `ANNOTATION_TASK_CREATED`/`ANNOTATION_STATUS_SYNC`. `persistAnnotations` (746) → fire-and-forget `SAVE_ANNOTATIONS` (auth error → `setSignedOut(true)`). `handleInputTask` (826) → `CREATE_ANNOTATION_TASK` then `notifyTasksCreated`. `handleRunEva` (877) → `RUN_ANNOTATION_TASK`. Escape (1105) → `setMode(null)`. Export `getTrackedTaskIds()`.

**`inspect-markdown.ts` (new)**: `formatInspectMarkdown(ctx: ExtractedContext)` → markdown with page URL, selector, tag/id/classes, React component chain + props/hooks summary + version, selected text if any, fenced outerHTML (already trimmed at capture). `copyToClipboard(text)` → `navigator.clipboard.writeText` with hidden-textarea `execCommand("copy")` fallback; returns boolean.

**`SelectionOverlay.tsx`**: reuse as-is for inspect mode (hover, arrow-key tree nav, React info, text-selection capture all already there). Minor: switch its theme read from sidepanel-written `chrome.storage.local` to content `theme.ts` helpers.

**`index.ts` rewrite**:

- Mount toolbar + annotation overlay + `ProjectModal` in shadow DOM as today.
- `registerInspectController`: `start()` mounts `SelectionOverlay` with `onCapture` → format + copy → `setToolbarFeedback("Copied to clipboard" | "Copy failed")`; mode stays active for repeated captures until toggled/Esc; `onCancel` → `setMode(null)`.
- Startup: `GET_TOOLBAR_VISIBILITY`; if visible → `showToolbar()` + `LOAD_ANNOTATIONS` → `setAnnotationsFromRemote`.
- `TOOLBAR_VISIBILITY_CHANGED` listener: show → load; hide → `hideToolbar()` + `clearAllAnnotations()` (old `PANEL_CLOSED` semantics).
- Status poller: `setInterval(15s)`; only when toolbar visible and `getTrackedTaskIds().length > 0` → `SYNC_TASK_STATUSES` → `applyTaskStatuses`; also fire once after annotations load; skip silently on error.

**`ProjectModal.tsx` (new, ~150 lines)**: shadow-DOM centred panel styled like `InputCard`; on open `LIST_PROJECTS` → rows of non-completed projects (filter `phase !== "completed"`, port `App.tsx:731-732`) + "New project title…" input (mutually exclusive); Confirm → `ADD_TO_PROJECT` → close + toolbar feedback; auth/repo errors inline.

## 4. Manifest / Vite / package.json

- `manifest.json`: remove `"sidePanel"` permission and `"side_panel"` block; add `"clipboardWrite"`; keep `cookies` + Clerk host permissions (needed by `syncHost`); `action.default_title` → "Toggle Eva toolbar".
- `vite.config.ts`: main build input becomes `{ background }` only (drop sidepanel.html entry + watchInclude); content sub-build unchanged; delete `sidepanel.html`.
- `package.json`: remove sidepanel-only deps: `@streamdown/*`, `streamdown`, `use-stick-to-bottom`, `use-chrome-storage`, `cmdk`, `convex-helpers`, `motion`, `lucide-react`, `nanoid`, `ai`. Cautious with `@radix-ui/*`/`clsx`/`class-variance-authority`/`tailwind-merge` — `@conductor/ui` ships raw `src/index.ts` barrel that may resolve them from the extension's node_modules; remove only if build still passes.
- Sweep: grep `apps/chrome-extension/src` for `sidepanel`, deleted message types, `api.sessions|messages|notifications|designSessions|repoEnvVars|sessionWorkflow|streaming`, `setToolbarVisible` — zero hits expected.

## Implementation order

1. `shared/messaging.ts` rewrite + `shared/task-description.ts`
2. Background: `convex.ts` → `repo-matching.ts` → `handlers.ts` → `index.ts`
3. Content: `toolbar-state.ts` → `AnnotationOverlay.tsx` decoupling → `index.ts` → `PageToolbar.tsx` → `inspect-markdown.ts` → `ProjectModal.tsx`
4. Manifest + vite
5. Delete sidepanel, prune deps, grep sweep

## Edge cases

- SW asleep: messages wake it; Clerk re-inits lazily (~1s first request — toolbar has loading state).
- Token expiry: fresh templated token per request.
- Icon on chrome:// pages: revert storage flip when `tabs.sendMessage` fails.
- Multiple tabs same URL: `SAVE_ANNOTATIONS` last-write-wins (same as today).
- Browser restart: `storage.session` clears → toolbar defaults hidden (intended).
- Clipboard blocked: textarea fallback, then "Copy failed" feedback.
- Run All pins now recolour once at completion instead of incrementally (minor UX change; per-pin push possible follow-up).

## Verification

1. `npx tsc --noEmit` in `apps/chrome-extension` clean; build (`pnpm build` in the extension) produces `dist/` with only `background.js`, `content.js`, `manifest.json`, `icons/`.
2. **Remove + re-add the unpacked extension** (clears persisted `openPanelOnActionClick` so `action.onClicked` fires).
3. Signed into Eva web app → icon click shows toolbar; click again hides; survives page reload and SW kill (chrome://serviceworker-internals → stop worker → navigate).
4. Annotate: place pin → Create Task → pin recolours with initials; task in Eva has rich description (selector + React tree). Run Eva on a pin works.
5. Run All: N pins → N tasks created + running, pins recolour, feedback correct.
6. Status poll: pin colour shifts within ~15s of status change; `done` removes pin.
7. Inspect: hover/arrow nav works; click copies; pasted markdown well-formed (React chain, selected-text variant, non-React page).
8. Project modal: list/create/assign all work.
9. Errors: signed out → "Sign in to Eva" opens web app; unmapped domain → "No repo mapped…".
10. Grep sweep clean (step 5 above).

## Risks

- **Highest**: missing `{ template: "convex" }` in `getToken` → opaque auth failures. Bake in and verify first.
- `@conductor/ui` barrel may transitively need radix deps — prune incrementally with build checks.
- Stale `openPanelOnActionClick` on existing dev installs blocks `action.onClicked` until extension is re-added.
