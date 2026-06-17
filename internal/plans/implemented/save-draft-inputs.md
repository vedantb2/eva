# Drafts page (Linear-style)

## Context

Typed-but-unsent input is lost across the app: task comment composers (`TaskActivityComposer`, `CommentReplyComposer`) and chat prompt inputs (session `ChatBody`, `DesignChatPanel`) hold text in ephemeral local/controller state, gone on navigate/reload. Quick-task drafts already persist (`agentTasks` draft status via `saveDraft`/`listDrafts`/`activateDraft`) but are only visible inside the `QuickTaskModal` popover. Build a repo-scoped Drafts page at `/$owner/$repo/drafts` listing all drafts as cards; clicking a card returns to where the draft lives.

User decisions: v1 surfaces = task comments + **session chat + design chat** prompts + existing quick-task drafts. New Convex table named `drafts`. Sidebar item next to Inbox, with count badge. Plus, from feedback:

- **`kind` column** naming the input surface, so adding draft types later is a literal + optional FK, and the page switches on `kind` instead of sniffing fields.
- **No mutation spam**: single-flight saves (Convex's official "throttling by single-flighting" pattern), not one mutation per keystroke. `useSingleFlight` is NOT in installed convex-helpers — add the hook.
- **Mention fidelity across reload**: store TOKENIZED content (`@[Label](id)`, `/[Label](id)`); on restore, parse tokens → display text + seed the editor's mention/skill maps so restored mentions re-submit as real mentions.
- **No typing before the draft query resolves**: composer is gated (disabled / not mounted) until `getForTarget` returns.

## Phase 1 — Backend (packages/backend/convex)

**`_validators/tableFields.ts`** — add fields + a shared target-arg validator:

```ts
// One row per (user, surface target). `kind` names the input surface so the
// table stays extensible. Exactly one target FK group is set, matching `kind`.
// Content is stored TOKENIZED (@[Label](id), /[Label](id)) so mentions survive reload.
export const draftFields = {
  userId: v.id("users"),
  repoId: v.id("githubRepos"),
  kind: v.union(
    v.literal("taskComment"),
    v.literal("sessionChat"),
    v.literal("designChat"),
  ),
  taskId: v.optional(v.id("agentTasks")),
  parentCommentId: v.optional(v.id("taskComments")), // taskComment reply target
  sessionId: v.optional(v.id("sessions")),
  designSessionId: v.optional(v.id("designSessions")),
  content: v.string(),
  updatedAt: v.number(),
};

// Discriminated target for get/set — explicit per surface, no field-sniffing.
export const draftTarget = v.union(
  v.object({
    kind: v.literal("taskComment"),
    taskId: v.id("agentTasks"),
    parentCommentId: v.optional(v.id("taskComments")),
  }),
  v.object({ kind: v.literal("sessionChat"), sessionId: v.id("sessions") }),
  v.object({
    kind: v.literal("designChat"),
    designSessionId: v.id("designSessions"),
  }),
);
```

The Comment-vs-Reply label is derived from `parentCommentId` (presentation, not stored). Quick-task drafts stay in `agentTasks`. No `requestingChanges` persistence (toggle gated by live task status).

**`schema.ts`** —

```ts
drafts: defineTable(draftFields)
  .index("by_user_and_task", ["userId", "taskId"])
  .index("by_user_and_session", ["userId", "sessionId"])
  .index("by_user_and_designSession", ["userId", "designSessionId"])
  .index("by_user_and_repo", ["userId", "repoId"]),
```

**New `_drafts/helpers.ts`**:

- `resolveTarget(ctx, target)` → `{ repoId, indexFind() }`: switch on `target.kind`, `ctx.db.get` the surface doc (task/session/designSession), throw if missing, access-check, return its `repoId` plus a closure that finds the existing draft row via the matching index (taskComment also filters `parentCommentId` in-handler).
- `deleteDraftForTarget(ctx, userId, taskId, parentCommentId)` — used by the comment-submit backstop (task surface only).

**New `_drafts/queries.ts`** (`authQuery`):

- `getForTarget({ target: draftTarget })` → `v.union(v.string(), v.null())` — tokenized content or null. (String keeps composers simple.)
- `listForRepo({ repoId })` → array of `{ _id, _creationTime, ...draftFields, contextTitle: v.string(), taskProjectId: v.optional(v.id("projects")) }`. `hasRepoAccess` gate; `by_user_and_repo`; per row, `ctx.db.get` the surface doc to fill `contextTitle` (task/session/design title — **verify title field names**) and, for tasks, `taskProjectId`; **skip rows whose surface doc is gone** (read-only, no inline delete); sort `updatedAt` desc.

**New `_drafts/mutations.ts`** (`authMutation`):

- `set({ target: draftTarget, content })` → null. `resolveTarget`; empty/whitespace → delete existing row; existing → patch `{ content, updatedAt: Date.now() }`; else insert `{ userId, repoId, kind: target.kind, ...surfaceFks, content, updatedAt }`.
- `remove({ id })` → null. Owner check, delete. (Page card delete.)

**New `drafts.ts`**: re-export queries + mutations (mirror `projects.ts`).

**`taskComments.ts`** — in `create`, after the insert: `await deleteDraftForTarget(ctx, ctx.userId, args.taskId, args.parentId)`. Backstop for the comment surface (chat surfaces self-clear via empty-save on send).

Then `cd packages/backend && npx convex codegen --typecheck enable`.

## Phase 2 — Mention round-trip support (shared `lib/components/mentions/`)

**`mentionToken.ts` (+ `skillToken.ts`)** — add:

- `extractMapsFromTokenizedText(content)` → `{ mentionMap, skillMap }` using existing `MENTION_TOKEN_REGEX` / `SKILL_TOKEN_REGEX`.
- `tokenizedToEditable(content)` → `{ displayText, mentionMap, skillMap }` — display via existing `mentionTokensToEditableText` + skill equivalent; maps via extract.

**`MentionEditor.tsx`** — add optional props `initialMentionMap?: Map<string, string>`, `initialSkillMap?: Map<string, string>`; seed the existing `mentionMap`/`skillMap` useState initializers. **Widen internal map value types to `string`** (`Id` is assignable to `string`; `tokenize` only concatenates ids into tokens) so seeding from parsed text needs no banned `as`; verify no path reads map values back as `TItem["id"]`.

**Forward the two props through** `CommentMentionInput.tsx`, `DescriptionMentionEditor.tsx`, and `MentionTextarea.tsx` (chat).

## Phase 3 — Shared single-flight hook

**New `apps/web/src/lib/hooks/useSingleFlight.ts`** — the hook from Convex's "throttling requests by single-flighting" article: wraps an async fn so at most one call runs at a time; calls during flight coalesce and the latest args run on completion. Used by all four composers.

## Phase 4 — Comment composers (controlled value, gated mount)

`TaskActivityComposer.tsx` and `CommentReplyComposer.tsx` — target `{ kind: "taskComment", taskId }` (+ `parentCommentId: parentId` for reply):

1. Outer: `const draft = useQuery(api.drafts.getForTarget, { target });`. While `undefined`, render composer chrome with the editor **disabled**. Once resolved, mount an inner form keyed on target.
2. Inner form gets `initialContent: string | null`:
   - `useState(() => tokenizedToEditable(initialContent ?? "").displayText)` for text; compute the maps once and pass to the editor's `initialMentionMap`/`initialSkillMap`. **No useEffect hydration.**
   - `const saveDraft = useSingleFlight(useMutation(api.drafts.set));`
   - `onValueChange`: `setText(next); saveDraft({ target, content: mentionRef.current?.tokenize(next) ?? next }); clearExecutionError();` — tokenize at save so stored content carries ids.
   - Submit: existing tokenize + `createComment`/request-changes flow; then `setText(""); saveDraft({ target, content: "" })` (deletes row; server backstop in `taskComments.create`). Keep `isSubmitting` useState + `mentionRef` reset/focus.

Keep both files < 250 lines; extract inner form to `_components/` if needed.

## Phase 5 — Chat composers (provider initialInput + sync child, gated mount)

Both mount `PromptInputProvider` and hold a `MentionTextareaHandle` `mentionRef` with `tokenize`. Session chat is inside shared `ChatBody` (driven by `ChatPanel`, `sessionId`); design chat is in `DesignChatPanel` (`designSessionId`).

**Shared pieces:**

- **`useChatDraftSeed(target)`** (new, `lib/components/chat/`): `useQuery(api.drafts.getForTarget, { target })`; returns `{ isReady: data !== undefined, ...tokenizedToEditable(data ?? "") }` (displayText + maps).
- **`<ChatDraftSync target mentionRef />`** (new, invisible, rendered **inside** `PromptInputProvider`): reads `usePromptInputController().textInput.value`; on change, single-flight `api.drafts.set({ target, content: mentionRef.current?.tokenize(value) ?? value })` (empty value → deletes row). Auto-clear after send fires this with `""`, so send-clear and draft-delete are handled with no extra send hook.

**`ChatBody.tsx`** — add optional `draft?: { target: DraftTarget; initialDisplay: string; mentionMap; skillMap }`. Pass `initialInput={draft?.initialDisplay}` to `PromptInputProvider`; forward `initialMentionMap`/`initialSkillMap` to `MentionTextarea`; render `<ChatDraftSync target mentionRef />` inside the provider when `draft` set. `ChatPanel.tsx` calls `useChatDraftSeed({ kind: "sessionChat", sessionId })`, gates the chat region on `isReady`, passes the `draft` prop.

**`DesignChatPanel.tsx`** — same wiring inline with `useChatDraftSeed({ kind: "designChat", designSessionId })`, gate on `isReady`, seed `initialInput` + maps, render `<ChatDraftSync />`.

v1 persists prompt **text only** (model/persona keep their existing `useSessionSettings` localStorage). Gating briefly disables the chat input on load — acceptable.

## Phase 6 — Drafts page

**New `drafts/index.tsx`**: `createFileRoute("/_repo/$owner/$repo/drafts/")({ component: DraftsClient })`.

**New `drafts/DraftsClient.tsx`** (thin): `useRepo()`; `useQuery(api.drafts.listForRepo, { repoId })` + `useQuery(api.agentTasks.listDrafts, { repoId })` (reuse — don't rebuild); merge into a discriminated card model in `_utils.ts`, sort `updatedAt` desc; `PageWrapper` title "Drafts"; spinner while either undefined; `EmptyState` ("Drafts save automatically as you type comments, prompts, or compose quick tasks.") when both empty.

**New `drafts/_components/DraftCard.tsx`**: bordered card (border-border, hover bg) with:

- kind badge: `taskComment`+`parentCommentId` → "Reply", `taskComment` → "Comment", `sessionChat` → "Session", `designChat` → "Design", agentTasks draft → "Task".
- context line: `contextTitle` (drafts rows) or task draft `title || "Untitled"`.
- `line-clamp-2` snippet: content is tokenized → render via `mentionTokensToEditableText` (+ skill) so tokens show as `@Label`.
- `RelativeDateTime` (apps/web/src/lib/components/RelativeDateTime.tsx).
- delete: drafts rows → `api.drafts.remove`; task drafts → `api.agentTasks.remove`.
- click (`useNavigate`): switch on kind —
  - taskComment: `taskProjectId` → `${basePath}/projects/${taskProjectId}/${taskId}/activity`; else `${basePath}/quick-tasks/${taskId}/activity`.
  - sessionChat → `${basePath}/sessions/${sessionId}`; designChat → `${basePath}/designs/${designSessionId}` (**verify default child route resolves**).
  - task draft → `${basePath}/quick-tasks` with `search: { draft: draft._id }`.

## Phase 7 — Open QuickTaskModal with a draft

**`quick-tasks/route.tsx`**: add `validateSearch` → `{ draft: typeof search.draft === "string" ? search.draft : undefined }`.

**`quick-tasks/QuickTasksClient.tsx`**: read param via `useSearch`; `useQuery(api.agentTasks.listDrafts, { repoId })`; `initialDraft = drafts?.find(d => d._id === draftParam)`; render `<QuickTaskModal key={initialDraft?._id ?? "new"} isOpen={isCreating || initialDraft !== undefined} initialDraft={initialDraft} ... />`; `onClose` clears `isCreating` + the param (`navigate({ to: ".", search: { draft: undefined }, replace: true })`); clear param if drafts loaded and id not found.

**`lib/components/quick-tasks/QuickTaskModal.tsx`** (minimal): optional `initialDraft?: FunctionReturnType<typeof api.agentTasks.listDrafts>[number]`; initialise existing useStates from it; `key` remount makes initializer-only hydration correct (no useEffect). Hydrate the tokenized description via `tokenizedToEditable` + pass seeded maps to `DescriptionMentionEditor` (also fixes the existing popover loadDraft mention degradation on this path). Existing `loadDraft`/popover/save-on-close untouched.

## Phase 8 — Sidebar

**`Sidebar.tsx`**: add `"drafts"` to `KNOWN_SUB_PAGES` (~line 65); nav item `{ name: "Drafts", href: `${repoBasePath}/drafts`, icon: DraftsIcon }` directly after Inbox; render count badge in the badge slot block (~770–789), null when 0.

**New `sidebar/DraftsCountBadge.tsx`** (model on `UnreadInboxBadge`): sum `api.drafts.listForRepo` + `api.agentTasks.listDrafts` lengths (cache-shared with the page).

**`sidebar/icons/AnimatedNavIcons.tsx`**: add `DraftsIcon` (pencil-on-document) per `InboxIcon` pattern.

## Order & delegation (Fable parsimony)

1. Backend (Phase 1) → codegen typecheck.
2. Mentions (Phase 2) + single-flight hook (Phase 3).
3. Comment composers (Phase 4).
4. Chat composers (Phase 5).
5. Drafts page + sidebar (Phase 6, 8).
6. Quick-task deep link (Phase 7).
7. `npx tsc --noEmit` in apps/web.

Delegate each phase to a `sonnet` subagent (one task each); review between phases.

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable`; `npx tsc --noEmit` in apps/web.
2. Manual (agent-browser, `/?agent`): for each surface — type incl. a `@doc` mention → reload → text + mention restored, submits as a real mention; editor disabled until draft loads; clear to empty → row gone; submit/send → composer clears, card gone; comment reply vs top-level coexist.
3. Network: hold a key — saves coalesce (single flight), not per keystroke.
4. Drafts page: comment/reply/session/design/task cards sorted by updated desc; tokens render as `@Label`; clicks land on the right page (modal opens with mentions intact for task drafts); deletes work; empty state renders.
5. Reactive: a draft typed elsewhere appears on the page + updates the sidebar badge without refresh.
6. No `any`/`unknown`/`as`/`!`; composers < 250 lines.

## Known limitations (accepted)

- Composer text doesn't live-sync between two tabs with the same composer open (local/controller state owns it after mount; syncs on remount).
- Stale mention label (entity renamed after save) round-trips with the old label — harmless; id is authoritative.
- Chat draft delete-on-send relies on the provider's post-send clear firing the sync child; if a send errors, the draft (correctly) remains.
