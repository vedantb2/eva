# Documents Page: Multiplayer Collaboration Upgrade

## Context

Docs page today: snapshot editing (Edit → TipTap → Save mutation writes markdown string), no comments, no usable history UI, last-save-wins between concurrent users. User wants Google-Docs-grade collaboration: live multi-user editing, anchored resolvable comments, suggestion (track-changes) mode, edit history with diffs.

Key leverage: `@convex-dev/prosemirror-sync` ^0.2.1 (resolved 0.2.3) + `@convex-dev/presence` are ALREADY installed in both `apps/web` and `packages/backend`, and the sync component is already registered in `convex.config.ts` + exposed in `packages/backend/convex/prosemirrorSync.ts` — just unused. Task comments (`taskComments.ts`, `taskSubscribers.ts`, notifications, mentions) provide a battle-tested pattern to mirror for doc comments.

## User-confirmed decisions

1. Full live co-editing via prosemirror-sync (no Save button; doc of record = synced PM JSON; `docs.content` markdown becomes a derived mirror for LLM workflows/copy/TOC).
2. Anchored inline comments (select text → comment), right-side panel, Open/Resolved filter, real-time.
3. Edit history: auto version snapshots on idle, author attribution, diff vs current, restore.
4. Suggestion mode: track-changes marks; anyone with repo access can accept/reject (incl. own).
5. PRD extraction: manual "Re-extract" button + stale indicator (no auto-on-save). Keep auto-extract on first PRD upload in DocsSidebar.
6. Comment notifications: full mirror of tasks (mentions, replies, auto-subscribe + subscriber broadcast).

## Verified API facts (no re-research needed)

- `useTiptapSync(api.prosemirrorSync, id, opts?)` from `@convex-dev/prosemirror-sync/tiptap` → `{ extension, isLoading, initialContent, create }`. Editor needs `content: sync.initialContent`, `extensions: [...ours, sync.extension]`. Extension uses prosemirror-collab; remote steps carry `"collab$"` meta.
- Server: `prosemirrorSync.create(ctx, id, jsonContent)`; `prosemirrorSync.transform(ctx, id, schema, fn)` EXISTS in 0.2.3; `syncApi({ checkRead, checkWrite, onSnapshot })` — `onSnapshot(ctx, id, snapshotString, version)` fires on client snapshot submits but is BYPASSED by `.create()`/`.transform()` (they must patch the mirror themselves). Delete sync data: `ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, { id })`. Existence check: `ctx.runQuery(components.prosemirrorSync.lib.getSnapshot, { id })` → `content: null` if none.
- `@tiptap/markdown` 3.22.x exports headless `MarkdownManager({ extensions })` with `.parse(md): JSONContent` and `.serialize(json): string` — no DOM refs (verified in dist). Marks without `renderMarkdown` serialize to "" wrapper (children text preserved).
- `@handlewithcare/prosemirror-suggest-changes` 0.1.8 (MIT, peer prosemirror 1.x = compatible with @tiptap/pm 3.x): suggestions are REAL marks (`insertion`/`deletion`/`modification`, each with `id` attr) applied via ordinary steps → sync + multiplayer for free. `transformToSuggestionTransaction(tr, state, generateId)` converts edits to suggestions; skips trs with `"history$"`/`"collab$"` meta or `suggestChangesKey {skip:true}` meta. Commands: `applySuggestion(id)`, `revertSuggestion(id)`, `applySuggestions`, `revertSuggestions`, `enable/disable/isSuggestChangesEnabled`. Custom `generateId` supported → encode author: `` `${userId}:${Date.now()}:${nanoid(6)}` ``.
- TipTap 3 extensions support `dispatchTransaction({ transaction, next })` middleware (verified @tiptap/core 3.22.3) — clean interception, no view monkey-patching.
- `BubbleMenu` available from `@tiptap/react/menus` (extension-bubble-menu is an optionalDep of @tiptap/react, installed). Zero new packages for comments UI.
- jsdiff (`diff` ^9) — only new dep besides prosemirror-suggest-changes. No diff util exists in monorepo (verified).

## Architecture keystone: shared editor schema module

**New `packages/shared/src/docEditor.ts`** (export `"./docEditor"` in package.json; add `@tiptap/core`, `@tiptap/markdown`, `@tiptap/starter-kit` to `packages/backend` deps + shared peerDeps, same specs as web):

- `docEditorExtensions: AnyExtension[]` = StarterKit (heading 1-6, `document: false`) + `SuggestableDocument` (Document.extend marks `"insertion deletion modification"`) + Markdown (gfm) + **base marks** (schema-only, shared-safe):
  - `DocCommentMark` — name `docComment`, attr `anchorId`, `excludes: ""`, `inclusive: false`, renders neutral `span[data-comment-anchor]`, `renderMarkdown` → children only (never leaks).
  - `SuggestionInsertion`/`SuggestionDeletion`/`SuggestionModification` — names exactly `insertion`/`deletion`/`modification` (library resolves by name), `id` attr, `inclusive: false`, library's parse/render specs, `renderMarkdown`: deletion → `""` (drop text), insertion/modification → children.
- `docMarkdownManager()`, `markdownToDocJson(md)`, `EMPTY_DOC`.

**Invariant (comment loudly):** every consumer of synced doc JSON uses this list — web editor, backend `onSnapshot` serializer, backend `transform`. Unknown mark in any schema = throw. Because of the `renderMarkdown` handlers, plain serialization yields **accepted-state, anchor-free markdown** everywhere (pending deletions excluded, insertions included) — this IS the mirror semantics (LLM sees suggestions as accepted; note in PR).

Client-only behavior (suggest-changes plugin/middleware, comment highlight plugin, click handlers) stays in apps/web as separate extensions — NOT in shared.

---

## Phase 1 — Live collab foundation

### Backend

1. `_validators/tableFields.ts`: add `docFields` (move docs table to xxxFields pattern; currently inline in schema.ts ~137-163). New fields: `contentUpdatedAt: v.optional(v.number())`, `lastParsedAt: v.optional(v.number())`. Rewire `schema.ts` `defineTable(docFields)` + replace hand-written `docValidator` in `docs.ts` with `v.object({ _id, _creationTime, ...docFields })`.
2. `prosemirrorSync.ts`: `syncApi<DataModel>({ checkRead, checkWrite, onSnapshot })`:
   - check\*: `getCurrentUserId` (auth.ts) + `ctx.db.normalizeId("docs", id)` + `hasRepoAccess` (functions.ts), throw otherwise. (Currently UNAUTHENTICATED — fixes a real hole.)
   - `onSnapshot`: `docMarkdownManager().serialize(JSON.parse(snapshot))` → skip if unchanged → patch `{ content, contentUpdatedAt, updatedAt }`.
   - **Gate early**: run `cd packages/backend && npx convex codegen --typecheck enable` right after this step — go/no-go for tiptap-in-isolate. Fallback if bundling fails: onSnapshot schedules internal `"use node"` action for conversion.
3. `docs.ts`:
   - `ensureSyncDoc` authMutation: access check → `lib.getSnapshot` existence check → `prosemirrorSync.create(ctx, id, markdownToDocJson(doc.content))` (idempotent; lazy migration of legacy docs).
   - `create`: also `prosemirrorSync.create(...)` so new docs are born synced.
   - `createFromSession` existing-doc branch: if no snapshot → create; else `prosemirrorSync.transform(ctx, id, getSchema(docEditorExtensions), (node) => new Transform(node).replaceWith(0, node.content.size, schema.nodeFromJSON(json).content), { clientId: "session-plan-sync" })`. Then patch mirror manually (transform bypasses onSnapshot). Comment: whole-doc replace clobbers concurrent edits — acceptable for this rare path.
   - `update`: drop `content` arg (title/description only; sole content caller was the deleted save path).
   - `remove`: add `components.prosemirrorSync.lib.deleteDocument` call; delete timeline functions (`saveVersion`, `timelineUndo/Redo/Status/History`, `docTimeline`, `parseSnapshot`, `snapshotValidator`, `deleteScope` call) — zero frontend refs (verified).
4. `docPrdWorkflow.ts`: thread `requestedAt = Date.now()` through start → success patches `lastParsedAt: requestedAt` (start-time stamping so mid-run edits still flag stale).

### Frontend

5. `search-params.ts`: `docModeParser` = `parseAsStringLiteral(["editing","suggesting","viewing"]).withDefault("editing")`, history replace. Read via `useQueryState("mode", docModeParser)`.
6. Rewrite `DocViewer.tsx` → thin orchestrator (<250 lines): header (title input, `DocPresenceFacepile`, copy [reads mirror `doc.content` — ≤~1s stale, fine], `DocModeSwitcher`, options menu), streaming banner, tabs. Remove: edit/save state + handlers, Edit button, MessageResponse read view, MarkdownEditor import, auto `startPrdParse`.
7. New in `docs/_components/`:
   - `DocContentTab.tsx`: `useTiptapSync(api.prosemirrorSync, doc._id)`; if `!isLoading && initialContent === null` → ref-guarded `ensureSyncDoc` + spinner (hook flips ready reactively); `useEditor({ content: sync.initialContent, extensions: [...docEditorExtensions, sync.extension, <client-only extensions>], editable: mode !== "viewing" })`; `editor.setEditable` on mode change (instance survives mode switches — required seam for suggesting); description Textarea; scroll container + FloatingToc (unchanged — scans rendered DOM headings; mirror updates retrigger).
   - `DocModeSwitcher.tsx`: Editing/Suggesting/Viewing dropdown.
   - `DocPresenceFacepile.tsx`: `usePresence(api.presence, "doc:" + doc._id, userId)` from `@convex-dev/presence/react`; stacked avatars + tooltips. New `users.profilesByIds` authQuery for `{ _id, name, accentColor }`. **No in-editor remote carets** (prosemirror-sync has no awareness protocol; 2-4 days of fiddly work — deferred).
   - `DocReExtractButton.tsx`: on requirements/user-flows tab header; stale = `content.trim() && (lastParsedAt === undefined || (contentUpdatedAt ?? updatedAt) > lastParsedAt)` → amber dot; disabled+spinner while `activeWorkflowId`; calls `startPrdParse`. Update empty-state copy in those tabs.
   - `DocTestGenDialog.tsx`: extract existing test-gen confirm dialog (line budget).
8. `vite.config.ts`: add `"@convex-dev/prosemirror-sync"` to `resolve.dedupe` (React hooks pkg, per CLAUDE.md rule).
9. `MarkdownEditor.tsx`: KEEP (second importer: `sessions/_components/SessionPrdPlanView.tsx`). Optionally import shared StarterKit/Markdown config to kill duplication.

### Known tradeoffs (accept, note in PR)

- Mirror lags live doc ~1s (snapshot debounce). First post-migration snapshot rewrites `content` in normalized markdown form.
- TipTap renders plain code blocks vs Streamdown's highlighting/mermaid in old read view — follow-up (lowlight).
- 1MB component snapshot limit — fine for PRD-scale docs.

---

## Phase 2 — Anchored comments

### Backend (mirror taskComments/taskSubscribers line-for-line; independent of Phase 1, can land first)

1. `_validators/tableFields.ts`: `docCommentFields` = `{ docId, content, authorId?, parentId?, anchorId?, anchorText?, resolvedAt?, resolvedBy?, deletedAt?, createdAt }` (thread root carries anchor + resolution; no separate threads table). `docSubscriberFields` = `{ docId, userId, subscribed, createdAt, updatedAt }`.
2. `schema.ts`: `docComments` index `by_doc`; `docSubscribers` indexes `by_doc`, `by_doc_and_user`.
3. New `docSubscribers.ts`: mirror `taskSubscribers.ts` — `ensureDocSubscribed`, `notifyDocSubscribers` (passes `docId` to createNotification), `listByDoc`, `setSubscription`. Access via doc → `hasRepoAccess`.
4. New `docComments.ts`: mirror `taskComments.ts` — `listByDoc` (oldest-first), `create` (root requires `anchorId`+`anchorText`, reply requires `parentId` same-doc; insert → ensureSubscribed → reply notification → mention notifications via `extractMentionedUserIds` + teamMembers gate → `notifyDocSubscribers` broadcast with `alreadyNotified` dedup), `update`/`remove` (author-only, soft delete with imported `DELETED_COMMENT_PLACEHOLDER`), `setResolved` (root-only, any repo member, patch `resolvedAt`/`resolvedBy`). Existing notification types (`comment_added`/`comment_reply`/`mention`) suffice; email debounce comes free.
5. `notifications.ts` `createNotification`: add optional `docId` param → href branch `` `${baseHref}/docs/${docId}/content` `` + contextLabel from doc title.

### Frontend

6. Promote generic atoms `CommentMentionInput.tsx` + `CommentSendButton.tsx` from `tasks/_components/` → `lib/components/comments/` (verified task-agnostic); update 3 task import sites.
7. `search-params.ts`: `docCommentFilterParser` = `parseAsStringLiteral(["open","resolved"]).withDefault("open")`, key `"comments"`.
8. New `docs/_utils/docCommentAnchors.ts`: client highlight plugin + helpers (the base mark lives in shared):
   - `DocCommentHighlight` Extension: PM plugin keyed `docCommentHighlightKey`, state `{ openAnchorIds, activeAnchorId }` set via tr meta from React; `decorations` walk doc, inline-decorate marks whose anchorId is open (`doc-comment-highlight` / `-active` classes — theme-token tints in stylesheet); `handleClick` → closest `[data-comment-anchor]` → `onAnchorClick(anchorId)`, return false.
   - Helpers: `readAnchorId` (typed narrowing — no `as`), `collectAnchorRanges(doc, anchorId)`, `collectPresentAnchorIds(doc)`, `addCommentAnchor(editor, anchorId)` (setMark on selection), `removeCommentAnchor` (attr-equal removeMark over ranges; composer cancel/failed submit), `selectionText(editor)`.
   - **Resolve never edits the doc**: React pushes `openAnchorIds` (unresolved roots ∪ pending) into plugin → highlights drop on every client reactively; reopen restores highlight, anchor never lost.
9. New `docs/_utils/docCommentThread.ts`: `buildRepliesByParentId`, `getThreadRoots` split open/resolved, `sortThreadsByDocPosition` (doc order, orphans by createdAt). Type via `FunctionReturnType<typeof api.docComments.listByDoc>[number]`.
10. New `docs/_components/` (each <250 lines): `DocCommentsPanel.tsx` (right rail w-80, Open/Resolved nuqs toggle, count), `DocCommentThread.tsx` (anchorText quote strip, orphan badge "Original text deleted" when anchorId ∉ presentAnchorIds, Resolve/Reopen, active ring + scroll-into-view ref), `DocCommentItem.tsx` (mirror CommentActivityItem minus reactions: edit-own, delete-own, MarkdownMentionText, optimistic updates vs listByDoc), `DocCommentReplyComposer.tsx`, `DocNewCommentComposer.tsx` (submit → create with anchorId+anchorText; cancel → removeCommentAnchor).
11. Wire into `DocContentTab`:
    - `BubbleMenu` (from `@tiptap/react/menus`): non-empty selection → "Comment" button → `anchorId = nanoid()` → `addCommentAnchor` immediately (pending highlight survives concurrent edits — mark maps through steps; no position bookkeeping) → composer in panel. Works in ALL modes (verify programmatic mark dispatch under `editable(false)`; fallback: dispatch `tr.addMark` on view directly).
    - Effect pushes `{ openAnchorIds, activeAnchorId }` meta on changes; `editor.on("update")` → `collectPresentAnchorIds` for orphan detection.
    - Two-way focus: highlight click → activate + scroll panel thread; thread click → activate + `domAtPos(range.from)` scrollIntoView.
    - Layout: content scroll | FloatingToc | DocCommentsPanel — hide TOC while panel open. Comments toggle button (open-thread count) in tab header. Extract `useDocComments(docId, editor)` hook into `_utils` if host nears 250 lines.

### Multiplayer/races (no extra work)

Marks ride sync steps. Comment on just-deleted text → mark collapses → orphaned thread (panel keeps anchorText quote). Resolve race → last-write-wins patch. Author Ctrl+Z after commenting removes mark → orphan until redo (accepted).

---

## Phase 3 — Suggestion mode

1. Add dep `@handlewithcare/prosemirror-suggest-changes ^0.1.8` (apps/web only — marks live in shared, plugin/commands client-only).
2. New `apps/web/src/lib/components/editor/suggestChanges.ts`:
   - `SuggestChangesKit = Extension.create<{ userId: string }>`: `addProseMirrorPlugins` → `[suggestChanges()]`; `dispatchTransaction({ transaction, next })` → if `isSuggestChangesEnabled(state)` && no `history$`/`collab$`/skip meta → `next(transformToSuggestionTransaction(transaction, state, generateId))` else `next(transaction)`. `generateId` = `` `${userId}:${Date.now()}:${nanoid(6)}` ``.
   - Helpers: `makeSuggestionId`/`parseSuggestionId`, `collectSuggestions(doc)` → `{ id, kind, userId, createdAt, from, to }[]` dedup by id.
3. Mode wiring in `DocModeSwitcher`/`DocContentTab`: suggesting → `enableSuggestChanges(editor.state, editor.view.dispatch)`; editing → `disableSuggestChanges`; viewing → disable + `setEditable(false)`. Pending count badge on switcher via `useEditorState` selector over `collectSuggestions`. Accept-all/Reject-all menu items (confirm dialog) → `applySuggestions`/`revertSuggestions`.
4. Mark CSS: Tailwind arbitrary selectors on EditorContent wrapper — `ins[data-id]` green tint, `del[data-id]` red strike, modification subtle underline.
5. New `docs/_components/SuggestionPopover.tsx`: floating card anchored via `view.coordsAtPos` on `selectionUpdate` when cursor enters a suggestion mark; shows kind + author name (`RelativeDateTime` from parsed id) + Accept/Reject (`applySuggestion(id)`/`revertSuggestion(id)`); hidden in viewing mode. Author names via new `docs.collaboratorNames` authQuery (`{ id, userIds[] }` → `[{ _id, name }]`, hasRepoAccess-gated).
6. Comment-mark interplay: `addCommentAnchor` in suggesting mode must NOT become a suggestion — set `suggestChangesKey {skip:true}` meta on the comment-mark transaction (and on restore, Phase 4).
7. **Verify during impl**: applySuggestion/revertSuggestion transactions don't get re-transformed while suggesting is on; if they do, wrap their dispatch with skip meta. Test: IME/CJK, large paste, whole-list-item deletion (may need `marks` on list extensions), accept text another user is touching.

Known accepted: typing adjacent to another user's pending insertion reuses their suggestion id (attribution merges) — document it.

---

## Phase 4 — Edit history

### Backend

1. `_validators/tableFields.ts`: `docVersionFields` = `{ docId, title, content (accepted-state markdown — diffs), pmContent (stringified PM JSON — exact restore incl. pending marks), authorIds: v.array(v.id("users")), createdAt }`; `docVersionDraftFields` = `{ docId, authorIds, updatedAt }`. `schema.ts`: both tables, index `by_doc`. `VERSION_CAP = 100`, prune oldest in saveVersion.
2. New `docVersions.ts`: `touchDraft({docId})` (upsert, add ctx.userId); `saveVersion({docId, content, pmContent})` — server guard: skip if `latest.pmContent === args.pmContent` (dedupe + multi-client race), authorIds from draft (fallback `[ctx.userId]`), clear draft, prune; `list({docId})` → light rows `{ _id, title, createdAt, authors:[{_id,name}] }` (NO content fields); `get({id})` → full. All hasRepoAccess-gated.
3. Drop convex-timeline entirely (verified docs-only): remove from `convex.config.ts` + BOTH package.jsons; `docs.remove` cleans docVersions/drafts instead of `deleteScope`. Local undo/redo = StarterKit history (collab-aware).

### Frontend

4. Add dep `diff` ^9 (jsdiff) to apps/web.
5. New `docs/_components/useDocVersionSnapshots.ts` (~90 lines): `editor.on("transaction")` count local changes only (`docChanged && !getMeta("collab$")`); `touchDraft` on first edit + max every 30s; idle timer 120s after last local edit → `saveVersion(editor.getMarkdown() /* accepted-state via shared renderMarkdown */, JSON.stringify(editor.state.doc.toJSON()))`. Tab-close-before-idle gap accepted (durability is sync's job; version lands next session).
6. New `docs/_components/DocHistoryPanel.tsx`: opened from Options dropdown ("Version history" — existing "View History" interview item stays); nuqs `useQueryState("history", parseAsBoolean)` + `"version"` id; list with RelativeDateTime + author avatars (pattern: TaskSubscribers.tsx).
7. New `docs/_components/DocVersionDiff.tsx`: `diffWords(version.content, doc.content)` → ins/del spans in `<pre class="whitespace-pre-wrap">`.
8. Restore (client-side through editor — server transform rejected as redundant): confirm dialog (copy states: discards suggestions made after that version; pending-at-snapshot suggestions return as pending; comment anchors not in that version orphan their threads) → pre-restore `saveVersion` (dedupe makes it free) → one chained tr with skip meta: `editor.chain().command(({tr}) => { tr.setMeta(suggestChangesKey, {skip:true}); return true; }).setContent(JSON.parse(version.pmContent), {emitUpdate:true}).run()` → syncs as steps, mirror + next version follow.

---

## Implementation order

Phase 2 backend (independent) or Phase 1 first — recommend: 1 → 2 → 3 → 4. Within Phase 1, run convex codegen typecheck immediately after step 2 (isolate go/no-go gate).

## New dependencies (justified)

- `@handlewithcare/prosemirror-suggest-changes` ^0.1.8 (apps/web) — maintained MIT track-changes; custom impl honestly 1500+ lines of PM edge cases.
- `diff` ^9 (apps/web) — no diff util in monorepo; zero-dep MIT.
- Backend deps: `@tiptap/core`, `@tiptap/markdown`, `@tiptap/starter-kit` (same specs as web — already in workspace).
- Verify `nanoid` present in apps/web; else `crypto.randomUUID()`.

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` (also the Phase-1 isolate gate).
2. `npx tsc` in apps/web; grep diff for `any`/`unknown`/`as `/`!.` violations.
3. Manual two-browser test (agent-browser skill, navigate `/?agent` to auto-sign-in): open same doc in two windows →
   - typing in A appears in B (live sync); facepile shows both.
   - legacy doc (created pre-change) opens via lazy `ensureSyncDoc` without content loss.
   - A selects text → comments → highlight + thread appear in B; B replies; A resolves → highlight drops in both; filter shows it under Resolved; delete anchored text → orphan badge.
   - A switches to Suggesting, types + deletes → B sees green/struck marks with A's attribution; B accepts one, rejects one; accept-all works; markdown mirror (copy button) shows accepted state only.
   - idle 2 min → version appears in history panel with authors; diff renders; restore works and syncs to B.
   - mention a user in a comment → notification with deep link to doc.
4. `docs.remove` on a test doc → no orphaned sync/comments/versions rows.
5. Run `/changelog` after completion.

## Defaults taken (flag if wrong)

- Default mode `editing`; `?mode=viewing` shareable.
- No resolve notifications; no doc-level unanchored comments (schema permits later); no emoji reactions on doc comments.
- Restore/accept/reject permission = anyone with repo access.
- Suggestions UI = floating popover (unified tabbed right panel with comments deferred).
- Copy button reads mirror (≤1s stale) not live editor.

## Unresolved questions

None blocking — all decisions confirmed or defaulted above.
