# Preview Annotations (Cursor-style) + Device Presets

## Context

Session Preview tab already behaves like a browser (proxy-injected nav-sync script → URL bar, back/forward, click-through all work). This feature adds the missing Cursor-style piece: a **select-element tool** — toggle it on, hover highlights elements inside the previewed app, click one → comment card pops up at the element → typed feedback is sent **immediately** as a chat message to the session agent. Chat shows a compact line; the agent prompt carries rich element context (selector, classes, outerHTML ≤2KB, computed styles, React component names). Also adds mobile/tablet/desktop device-width presets to the preview toolbar. Session preview only (not Designs). Zero new deps.

**Why this architecture**: preview iframe is cross-origin → element capture must run in a script injected by the in-sandbox proxy (existing `injectHtml` pipeline in `previewProxy.ts`); the comment card renders in the parent (design system) positioned over the iframe; they talk via postMessage (existing `eva-preview-*` pattern).

**Verified facts** (from code): `buildPreviewProxyScript` returns the proxy `.mjs` source as one template string with nav-sync `injectedScript` inside it; `SCRIPT_VERSION` exact-match forces relaunch; `getPreviewUrl` passes `inject: navigationSync===true` and `useSandboxPreview` always sends `navigationSync:true` → reuse that flag. Display/prompt split works: `startExecute(message)` builds prompt from its arg via `buildSessionPrompt` (never reads messages table), `addMessage(content)` is separate. Queue path needs one additive field. `useSessionSettings` is localStorage keyed by sessionId → no desync between panels.

## Phase A — Injected annotation script (backend)

### A1. NEW `packages/backend/convex/_daytona/previewAnnotationScript.ts` (~350 lines)

Plain TS module, no `"use node"`, no imports (precedent: `previewGrantConfig.ts`; backend tsconfig has `dom` lib). Exports:

- `function evaPreviewAnnotationScript(): void` — fully self-contained (embedded via `.toString()`, so no imports/outer refs; helpers nested inside).
- `function buildAnnotationScriptSource(): string` → `"(" + fn.toString() + ")();"`.
- `interface EvaAnnotationContext`: `tagName, id, classNames[], selector, textContent(≤300), outerHTML(≤2048), attributes(≤20, values ≤200), boundingRect{top,left,width,height}, computedStyles(whitelist: color,backgroundColor,fontSize,fontWeight,fontFamily,display,position,margin,padding,borderRadius), reactComponents[](≤3 nearest-first), pageUrl, pagePath, capturedAt`.

Script behavior:

- Re-run guard via `document.documentElement` `data-eva-annotate` attribute (avoids `window` typing games — no `as` allowed).
- `parentOrigin` from `document.referrer` (copy nav-sync pattern); inbound messages verify `event.origin === parentOrigin` when not `"*"`.
- Inert until armed. Overlay DOM (highlight box + `Component <tag.cls>` label, `position:fixed`, `pointer-events:none`, z-index 2147483646, hardcoded colors — parent theme unreachable) created lazily.
- Inbound: `eva-preview-annotate-mode {active}` (arm/disarm, disarm clears all + cursor), `eva-preview-annotate-clear` (clear selection highlight).
- Outbound: `eva-preview-annotate-ready` (on init → drives parent re-arm after reload), `eva-preview-annotate-selected {context, rect}`, `eva-preview-annotate-rect {rect|null}` (rAF-throttled on capture-phase scroll + resize while selection exists), `eva-preview-annotate-dismissed` (Esc).
- Capture-phase listeners installed once, gated on mode: `mousemove` → hover highlight; `click` → `preventDefault()`+`stopImmediatePropagation()`, capture context, post selected; `keydown` Esc; `crosshair` cursor while armed.
- Context capture: port `captureContext` from `apps/chrome-extension/src/content/AnnotationOverlay.tsx` (~line 152) with caps; selector gen ported from `react-extractor.ts` `generateSelector` (~line 320).
- React names without devtools hook: walk up from element scanning `Object.keys(el)` for `__reactFiber$*`/`__reactInternalInstance$*`, then walk `fiber.return` collecting `type.displayName || type.name` (function/class fibers only). Names only, no props/state.

### A2. MODIFY `packages/backend/convex/_daytona/previewProxy.ts`

- Import `buildAnnotationScriptSource`; **bump `SCRIPT_VERSION`** (line ~28) → `"annotate-v11"`.
- In the proxy-source template next to nav-sync (~line 467): `const ANNOTATION_SCRIPT = ${JSON.stringify(buildAnnotationScriptSource())};` (single-line JSON literal → no heredoc-sentinel collision, no `String.raw` issues; matches existing `${JSON.stringify(params.sandboxId)}` pattern).
- `buildInjectionTag` (~line 469): `const combined = injectedScript + "\n" + ANNOTATION_SCRIPT;` then existing `</script` escape. One tag, keep `data-eva-preview-nav-sync` idempotence marker.
- No changes to `resolveRoute`, auth gate, `launchProxy`, `execution.ts`. Same script runs on Daytona + Vercel (pure DOM).

## Phase B — Queue-path display split (backend)

Compact display vs rich prompt when agent is mid-turn (enqueue stores one string today):

- **B1** `packages/backend/convex/_validators/tableFields.ts` (~line 408): add `displayContent: v.optional(v.string())` to `queuedMessageFields` (comment: compact chat-display text; `content` = full agent message). Schema + return validators update via spread. Additive — no migration.
- **B2** `packages/backend/convex/_sessions/execution.ts` `enqueueMessage` (~line 152): accept + store `displayContent`.
- **B3** `packages/backend/convex/_queues/helpers.ts` `startNextQueuedSessionMessage`: user-doc insert uses `displayContent ?? content` (~line 63); workflow arg stays `content` (~line 75). Other entity helpers untouched.
- **B4** `packages/backend/convex/queuedMessages.ts` `update` (~line 36): patch clears `displayContent` (edited queued annotation degrades to plain message).
- **B5** `apps/web/src/lib/components/chat/ChatBody.tsx` (~line 304): queued chip renders `displayContent ?? content`.

Known accepted degradation: `restageOpenTurn` (ops-recovery, `_sessions/workflow.ts` ~886) rebuilds prompt from stored compact content — fine, agent transcript already holds prior context.

## Phase C — Web app (route-local, under `apps/web/src/routes/_repo/$owner/$repo/sessions/`)

### C1. NEW `_utils/-previewAnnotation.ts` (pure helpers)

- `type PreviewDevice = "desktop" | "tablet" | "mobile"`; `PREVIEW_DEVICE_WIDTHS = { mobile: 390, tablet: 768 }`.
- `interface PreviewAnnotationContext` (same shape as backend `EvaAnnotationContext` — deliberately re-declared: postMessage is an untrusted boundary, validate structurally, don't import backend internals).
- Message parsing for discriminated union `ready | selected | rect | dismissed` — follow PreviewNavBar's inline structural narrowing on `event.data` (field-by-field checks; do NOT write `any`/`unknown` keywords).
- `buildAnnotationPrompt(feedback, ctx)` — markdown modeled on `apps/chrome-extension/src/shared/task-description.ts` `buildContextDescription`: feedback first, then annotation block (page path, selector, id/classes, React chain, text, key styles, fenced `html` outerHTML).
- `buildAnnotationDisplay(feedback, ctx)` — compact: `${feedback}\n\n[Annotated <tag.cls> on ${pagePath}]` (plain text renders fine via `MessageMentionText`; no renderer change in v1).

### C2. NEW `_components/useAnnotationBridge.ts` (hook, ~120 lines)

`useAnnotationBridge({ iframeRef, enabled }) → { mode, setMode, pending, clearPending }`

- Listener filtered by `event.source === iframeRef.current?.contentWindow` (PreviewNavBar pattern); also watches existing `{type:"navigation"}` to clear stale `pending`.
- `ready` → if mode on, re-post arm (**re-arm after reload/full-page nav; mode stays on**) + clear pending. `selected` → set pending; `rect` → update rect (card tracks scroll); `dismissed` → clear.
- `setMode` posts `eva-preview-annotate-mode` (targetOrigin `"*"` like `postHistoryCommand` — payload is a boolean, nothing sensitive); `clearPending` posts `eva-preview-annotate-clear`.

### C3. NEW `_components/useSessionAnnotationSend.ts` (hook, ~70 lines)

`useSessionAnnotationSend(sessionId) → (display, full) => Promise<void>`

- `useRepo()` + `useSessionSettings(String(sessionId), …)` (same localStorage key as ChatPanel → identical mode/model/reasoning).
- `useQuery(api.messages.listByParent…)` via `convex-helpers/react/cache/hooks` (dedupes with SessionDetailClient); `isExecuting` = last msg is assistant with empty content (ChatPanel ~242).
- Executing → `enqueueMessage({ sessionId, message: full, displayContent: display, mode, model, reasoningLevel })`; else `Promise.all([addMessage({id, role:"user", content: display, mode}), startExecute({sessionId, message: full, …})])` with ChatPanel's catch→assistant-error fallback. No optimistic update in v1.

### C4. NEW `_components/AnnotationCommentCard.tsx` (~140 lines)

`{ context, position:{left,top}, onSubmit(feedback), onCancel, isSubmitting }`. Absolutely positioned `w-80 bg-popover border border-border rounded-lg shadow-lg`: header chip (`<tag.cls>` + first React name + trimmed text), autofocus `Textarea` (Enter submit / Shift+Enter newline / Esc cancel), Cancel + "Send to Eva" buttons. Design system only.

### C5. NEW `_components/PreviewAnnotationLayer.tsx` (~110 lines)

Rendered inside `WebPreview` (so `useWebPreview()` → iframeRef), sibling of `WebPreviewBody` in a shared `relative` wrapper: `absolute inset-0 pointer-events-none` (card `pointer-events-auto`). Props `{ mode, onModeChange, onSubmit }`. Hosts bridge; converts iframe-viewport rect → layer coords via `iframeRef.getBoundingClientRect()` minus layer rect (handles device-preset `mx-auto` inset); clamps card in bounds; submit → build display+prompt → `onSubmit` → `clearPending`.

### C6. NEW `_components/PreviewDeviceToggle.tsx` (~40 lines, presentational)

Mirror `DesignPreviewPanel.tsx` (~108-125) Tabs with `IconDeviceDesktop`/`IconDeviceTablet`(verify exists, else `IconDeviceIpad`)/`IconDeviceMobile`.

### C7. MODIFY `WebPreviewPanel.tsx`

- New optional prop `onAnnotationSubmit?: (display: string, full: string) => Promise<void>` (hidden toggle when absent → task/project previews unaffected).
- Device state: **per-pane** `useSessionStorage<PreviewDevice>(`${pathStorageKey}:device`, "desktop")` (nuqs rejected: multiple simultaneous panes can't share one query param).
- Annotation mode `useState` here; annotate toggle button (`WebPreviewNavigationButton` + `IconPointer`/`IconClick`, active = `text-primary bg-secondary`) + `PreviewDeviceToggle` in the panel's nav row wrapper — **do not modify shared `PreviewNavBar`** (Designs uses it).
- Wrap body: `<div className="relative flex min-h-0 flex-1 flex-col">` around `WebPreviewBody` + `PreviewAnnotationLayer`. Device width via WebPreviewBody passthrough: `className="mx-auto border-x border-border"` + `style={{ width: PREVIEW_DEVICE_WIDTHS[device], maxWidth: "100%" }}` when non-desktop (zero `packages/ui` changes — it already merges className/style onto iframe).
- Extract existing inline `NavigationBar` → `_components/PreviewPanelNavBar.tsx` (file would exceed ~250-line cap).

### C8. Thread callback

- `apps/web/src/lib/components/sandbox/SandboxPaneSlots.tsx`: optional `onAnnotationSubmit`, passed to every `WebPreviewPanel`.
- `sessions/SandboxPanel.tsx`: `const submitAnnotation = useSessionAnnotationSend(sessionId)` → pass down. `TaskSandboxPanel`/`ProjectSandboxPanel` untouched.

## Edge cases

| Case                          | Handling                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Iframe reload / full-page nav | injected script re-inits → `ready` → parent re-arms mode, clears stale pending             |
| Scroll/resize with card open  | iframe re-reports rect (rAF) → card tracks; `rect:null` (element gone) → card stays put    |
| Multi-pane                    | bridge per pane (`event.source`-scoped); mode + device per pane                            |
| Agent executing               | queued with `displayContent`; chip shows compact text                                      |
| Stale proxy after deploy      | version bump → relaunch on next `getPreviewUrl`; until refresh, toggle no-ops — acceptable |
| No `document.referrer`        | parentOrigin `"*"` fallback (nav-sync precedent); origin check skipped only then           |

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable`; `cd apps/web && npx tsc`.
2. Scratch node run: print `buildPreviewProxyScript(...)` → `node --check` parses; `ANNOTATION_SCRIPT` single line; no bare heredoc sentinel line.
3. Live session (Daytona + Vercel repo; deploy Convex to dev `good-mule-506` on feature branch): health shows `annotate-v11`; hover highlight + React name (React app) and plain-HTML app; click → card at element (also with device preset active); submit idle → chat compact / agent prompt rich (verify via streamed activity referencing selector); submit while executing → queued chip compact, dispatched prompt full; Esc / scroll / reload re-arm; device toggle persists per pane; second pane independent; task/project previews: device toggle yes, annotate button no; Designs unaffected.
4. Run **/ship** skill (final step).

## Unresolved questions

None blocking — icon picks (`IconPointer` vs `IconClick`, tablet icon) verified at implementation time.
