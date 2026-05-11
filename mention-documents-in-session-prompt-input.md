# @-Mention Documents in Session Prompt Input

## Context

User wants to reference docs from the prompt input on Sessions and Design Sessions. Typing `@` opens a filter-as-you-type popup of repo docs. Selecting one inserts an atomic pill. On submit:

- The user's message renders the mention as a bold clickable link in chat history (click navigates to `/{owner}/{repo}/docs/{id}`).
- The full doc content is injected as a "Referenced documents" prefix block into the AI prompt, so the agent has the doc as context.

Docs are repo-scoped (`docs.repoId`). Popup lists current repo only, sorted alphabetically by title. No content size cap in v1.

## Storage Format

Single-string token in existing `messages.content` (no schema change):

```
@[Doc Title](docId)
```

Regex (shared frontend + backend):

```
/@\[([^\]]{1,200})\]\(([a-z0-9_]{16,40})\)/g
```

The Convex doc id charset (`[a-z0-9_]`) makes matches unambiguous against ordinary markdown links.

## New Files

### Backend

- `packages/backend/convex/_mentions/mentionToken.ts`
  - `MENTION_TOKEN_REGEX`, `formatMentionToken(label, id)`, types.
- `packages/backend/convex/_mentions/resolveDocMentions.ts`
  - `resolveDocMentions(ctx: QueryCtx, message: string, repoId: Id<"githubRepos">)` →
    - Extract all unique `docId`s from tokens
    - For each: `ctx.db.get(id)`; drop if null or `doc.repoId !== repoId`
    - Build `prefixBlock`: `## Referenced documents\n\n### {title}\n{content}\n\n---\n` per resolved doc (deduped by id)
    - Replace inline tokens with plain `@{Title}` (use snapshot title from token; for unresolved docs leave as `@{Title}` plain)
    - Return `{ resolvedMessage, prefixBlock }`
  - `stripMentionTokens(message: string): string` → replace tokens with plain `@{Title}`. Used for history.

### Frontend

- `apps/web/src/lib/components/chat/mentionToken.ts` (mirror of backend regex)
- `apps/web/src/lib/components/chat/MessageMentionText.tsx`
  - Props: `{ text: string; owner: string; repo: string }`
  - Splits text by `MENTION_TOKEN_REGEX`. Mention segments → `<button>` with `bg-muted text-foreground rounded px-1 font-medium hover:bg-muted/80`, `useNavigate` to `/$owner/$repo/docs/$id`. No shadow, no border.
  - Plain segments preserve `whitespace-pre-wrap break-words`.
- `apps/web/src/lib/components/chat/MentionPromptInput.tsx`
  - Tiptap-based editor; drop-in replacement for `<PromptInputTextarea />` inside `<PromptInput>`.
  - Props mirror `PromptInputTextarea` plus: `docs: Doc<"docs">[]`, `owner: string`, `repo: string`.
  - Extensions: `Document`, `Paragraph`, `Text`, `Placeholder`, `Mention.configure({ HTMLAttributes: { class: "bg-muted rounded px-1 font-medium" }, suggestion: mentionSuggestion(docs) })`. Skip `StarterKit` (we don't want bold/italic etc.).
  - Bridge to `PromptInputProvider` via `useOptionalPromptInputController`:
    - `editor.on("update")` → serialize doc → tokens → `controller.textInput.setInput(serialized)`
    - `useEffect` on `controller.textInput.value` → if differs from current serialized, parse tokens to doc → `editor.commands.setContent(...)` (handles speech-to-text + reset-after-submit)
  - `editorProps.handleKeyDown`: Enter (no Shift, no IME) → `formRef.current?.requestSubmit()`. Match `PromptInputTextarea:836-881` semantics.
  - `immediatelyRender: false` (matches `MarkdownEditor.tsx:43`).
- `apps/web/src/lib/components/chat/mentionSuggestion.tsx`
  - Tiptap `suggestion` config builder. `char: "@"`, `items: ({ query }) => docs.filter(d => d.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.title.localeCompare(b.title))`.
  - `render`: returns `{ onStart, onUpdate, onKeyDown, onExit }`. Mounts a portaled cmdk `Command` + `Popover` anchored at `props.clientRect()`.
  - cmdk handles arrow/Enter; on select, calls Tiptap's `command({ id, label })` → inserts atomic mention node.
- `apps/web/src/lib/components/chat/mentionSerialize.ts`
  - `serializeMentionDoc(doc: ProseMirrorNode): string` — walks descendants; mention nodes → `@[label](id)`; text → `node.text`; paragraph boundaries → `\n`.
  - `parseMentionString(text: string): JSONContent` — inverse, for external string → editor doc.
  - Typed `readMentionAttrs(node)` with runtime checks (no `as`, no `any`).

## Modified Files

### Backend (3 files)

- `packages/backend/convex/sessionWorkflow.ts`
  - In `getSessionData`, before mode branch:
    ```
    const { resolvedMessage, prefixBlock } = await resolveDocMentions(ctx, args.message, session.repoId);
    const finalMessage = prefixBlock ? `${prefixBlock}\n\n${resolvedMessage}` : resolvedMessage;
    ```
    Pass `finalMessage` into `buildEditPrompt`/`buildPlanPrompt`.
- `packages/backend/convex/designWorkflow.ts`
  - In `getSessionDataAndPrompt` (line 210), same resolution before `buildDesignPrompt`.
  - Inside `buildDesignPrompt`, when slicing history (line 68–72), wrap each `m.content` with `stripMentionTokens(...)`.
- (No change) `packages/backend/convex/_queues/helpers.ts` — both queue dequeue paths re-enter `getSessionData` / `getSessionDataAndPrompt`, so mentions resolve automatically.

### Frontend (3 files)

- `apps/web/src/routes/_repo/$owner/$repo/sessions/ChatPanel.tsx`
  - Replace `<PromptInputTextarea />` (line 814) with `<MentionPromptInput docs={docs} owner={repo.owner} repo={repo.name} />`.
  - Add `const docs = useQuery(api.docs.list, { repoId: repo._id }) ?? [];`.
  - Replace user-message `<p>` (line 723) with `<MessageMentionText text={message.content} owner={repo.owner} repo={repo.name} />`.
- `apps/web/src/routes/_repo/$owner/$repo/designs/_components/DesignChatPanel.tsx`
  - Same two swaps (textarea ~line 325, user-message ~line 277).
- `apps/web/vite.config.ts`
  - Add `"@tiptap/react"`, `"@tiptap/core"` to `resolve.dedupe` (line 103).

### Package

- `apps/web/package.json` — add:
  - `@tiptap/extension-mention@^3.20.1`
  - `@tiptap/suggestion@^3.20.1`
- Run `pnpm install`.

## Out of Scope

- `apps/chrome-extension/.../ChatPanel.tsx`, `apps/web/.../projects/ProjectChatArea.tsx` — keep `PromptInputTextarea`, no mentions.
- `QueuedMessagesPanel.tsx` truncated preview — leave raw tokens for v1 (it's a small admin affordance; user accepted no extra polish here).

## Edge Cases

- **Doc deleted after mention**: backend resolver drops it from prefix; frontend renders `@Title` plain (no link target click would 404, current `$id.tsx` already shows "Document not found" — acceptable).
- **Doc renamed**: link still works (uses docId); displayed label is the snapshot title from the token (preserves message accuracy).
- **Same doc mentioned twice**: each token renders independently; prefix block deduped by docId.
- **Cross-repo docId paste**: `resolveDocMentions` validates `doc.repoId === session.repoId` — drops mismatches, no content leak.
- **Speech-to-text writes to controller**: editor `useEffect` on controller value resyncs (parse string → doc).

## CLAUDE.md Adherence

- No `any`/`unknown`/`as`/`!`. Typed `readMentionAttrs` with runtime checks (mirror `parseSnapshot` in `docs.ts:13`).
- Convex types directly: `Doc<"docs">`, `Id<"githubRepos">`, `Id<"docs">`.
- Mention pill: `bg-muted` only — no shadow, no border, hover bg shift.
- TanStack Router: `useNavigate`, not `<a>`/`window.location`.
- File sizes <250 lines: editor split into 4 small co-located files (`MentionPromptInput`, `mentionSuggestion`, `mentionSerialize`, `mentionToken`).
- No `useState` for derivable state: suggestion popup open state lives in Tiptap suggestion plugin, not React state.

## Implementation Sequence

1. Backend regex constants → `_mentions/mentionToken.ts`
2. Backend resolver → `_mentions/resolveDocMentions.ts` (incl. `stripMentionTokens`)
3. Wire `sessionWorkflow.getSessionData` and `designWorkflow.getSessionDataAndPrompt`; add `stripMentionTokens` to `buildDesignPrompt` history loop
4. Run `npx convex codegen --typecheck enable` in `packages/backend` to validate
5. Frontend regex → `chat/mentionToken.ts`; renderer → `chat/MessageMentionText.tsx`
6. Replace `<p>` user-message render in both ChatPanels — verify existing messages render unchanged
7. `pnpm add @tiptap/extension-mention @tiptap/suggestion -w apps/web`
8. Update `vite.config.ts` dedupe
9. Editor scaffold (`MentionPromptInput.tsx`) without popup — verify drop-in works for plain text
10. Suggestion popup (`mentionSuggestion.tsx`) + serialize/parse helpers
11. Wire DesignChatPanel
12. End-to-end manual test (see Verification)

## Verification

- `cd packages/backend && npx convex codegen --typecheck enable` — passes
- `cd apps/web && npx tsc --noEmit` — passes
- Manual e2e (against running dev):
  1. Open a session; type `@` — popup appears with current repo docs, alphabetical
  2. Type a few chars — list filters
  3. Click/Enter selects → atomic pill appears in input; backspace deletes whole pill
  4. Submit → user message in history shows `@Title` bold, click navigates to `/owner/repo/docs/id`
  5. Inspect prompt-history.txt or sandbox prompt logs — confirm `## Referenced documents` block is prepended with full doc content, inline tokens replaced with plain `@Title`
  6. Same flow on Design Session — verify history's last 6 messages have tokens stripped to plain `@Title`
  7. Mention a doc, queue while a session is running, verify dequeue → workflow → resolves correctly
  8. Mention doc, then delete doc, then click link in old message → "Document not found" page (acceptable)
  9. Test with no docs in repo — popup shows empty (or hidden) gracefully

## Unresolved Questions

None at this time.
