# Paste-as-file in chat composers

## Context

Pasting a wall of text into a composer floods the input. Instead, pastes over 2,000 chars should attach as a `.txt` file (like Claude.ai). Clicking the chip opens a modal with word/char counts and a fixed-height scrollable textarea — editable pre-send, read-only on sent messages. Applies to: sessions chat, new-session composer, quick task modal, project sandbox chat, task sandbox chat.

Backend needs **zero changes**: text attachments already flow `attachmentStorageIds` → materialized as `/tmp/eva-attachment-N.txt` on every surface (execution.ts:1552 for sessions; projectChatDaemon/taskChatDaemon → callback-src `materializeTurnAttachments` for sandbox chats).

User decisions: threshold 2,000 chars; read-only viewer post-send; **unify attachment modes** — project/task sandbox chat accept the same formats as sessions.

## Part 1 — Remove `ChatAttachmentMode` (unification refactor)

Every surface moves to the sessions accept list, so the `"images" | "sessionFiles"` mode dies.

[attachmentMeta.ts](apps/web/src/lib/components/attachments/attachmentMeta.ts):
- Delete `ChatAttachmentMode` type and `chatAttachmentAccept(mode)`.
- Rename `SESSION_ATTACHMENT_ACCEPT` → `CHAT_ATTACHMENT_ACCEPT`. Keep `IMAGE_ATTACHMENT_ACCEPT` (still used by ComposerPlusMenu "Add photos" picker).
- `chatAttachmentErrorMessage(mode, err)` → `chatAttachmentErrorMessage(err)` with the sessionFiles wording.
- `isAllowedAttachmentFile(mode, file)` → `isAllowedAttachmentFile(file)` = image OR session text.

Consumers (mechanical — drop the mode param/prop everywhere):
- [imageAttachments.tsx](apps/web/src/lib/components/chat/imageAttachments.tsx) — also delete deprecated `imageAttachmentErrorMessage` + `useUploadImageAttachments` (no consumers); `useUploadChatAttachments()` takes no arg.
- [ChatComposer.tsx](apps/web/src/lib/components/chat/ChatComposer.tsx) (prop at 112/145, accept at 287, error at 292, forwards at 315/322), [ChatBody.tsx](apps/web/src/lib/components/chat/ChatBody.tsx) (95/136/269).
- [ChatPanel.tsx:389](apps/web/src/routes/_repo/$owner/$repo/sessions/ChatPanel.tsx:389) and [NewSessionComposer.tsx:221](apps/web/src/routes/_repo/$owner/$repo/sessions/_components/NewSessionComposer.tsx:221) — delete `attachmentMode="sessionFiles"`.
- ProjectSandboxChatPanel / TaskSandboxChatPanel: no edit — removing the default flips them.
- [ComposerPlusMenu.tsx](apps/web/src/lib/components/chat/_components/ComposerPlusMenu.tsx) (113), [ComposerStash.tsx](apps/web/src/lib/components/chat/_components/ComposerStash.tsx) (106-118), [useComposerStash.ts](apps/web/src/lib/components/chat/_components/useComposerStash.ts) (65-72, 166), [useTaskAttachments.ts](apps/web/src/lib/components/quick-tasks/useTaskAttachments.ts) (54, 81), [TaskFilesSection.tsx](apps/web/src/lib/components/quick-tasks/_components/TaskFilesSection.tsx) (113).

## Part 2 — Paste helpers (attachmentMeta.ts)

```ts
export const PASTE_ATTACHMENT_THRESHOLD_CHARS = 2000;
export function buildPastedTextFile(text: string): File; // new File([text], "pasted-text.txt", { type: "text/plain" })
export function attachPastedTextIfLarge(text, currentCount, add): boolean;
// false when under threshold OR at MAX_CHAT_ATTACHMENTS cap → caller inserts inline (paste never silently swallowed)
```

## Part 3 — Paste interception

[MentionEditor.tsx](apps/web/src/lib/components/mentions/MentionEditor.tsx) `handlePaste` (823-851): new prop `onLargeTextPaste?: (text: string) => boolean`. After the image branch, read `text/plain`; if handler returns true, `preventDefault` and return; else existing inline insert. Threshold logic lives in the callback, not the editor.

Wiring:
- [MentionTextarea.tsx](apps/web/src/lib/components/chat/MentionTextarea.tsx): rename `enableImagePaste` → `enableAttachmentPaste` (only consumer: ChatComposer.tsx:306); when set, also pass `onLargeTextPaste={(text) => attachPastedTextIfLarge(text, attachments.files.length, attachments.add)}` — `add` is the validated PromptInput add (accept/size/cap + toasts for free). Covers sessions, new-session, both sandbox chats.
- [DescriptionMentionEditor.tsx](apps/web/src/lib/components/tasks/_components/DescriptionMentionEditor.tsx): pass-through prop next to `onImageFiles`.
- [QuickTaskModal.tsx](apps/web/src/lib/components/quick-tasks/QuickTaskModal.tsx) (~376): wire to `useTaskAttachments` add/count. Title `<Input>` untouched by design.

## Part 4 — `replace(id, file)` on both attachment stores

[prompt-input.tsx](packages/ui/src/ai-elements/prompt-input.tsx):
- Add `replace: (id: string, file: File) => void` to `AttachmentsContext` (~100): revoke old object URL, keep same id + array position, new `filename`/`mediaType`/`url`. Implement in provider (~200) and local fallback (~505); wire `usingProvider ? controller.attachments.replace : replaceLocal` (~581) into context + provider memo. Follow the file's existing useCallback convention (packages/ui not under app compiler rules). No re-validation on replace.

[useTaskAttachments.ts](apps/web/src/lib/components/quick-tasks/useTaskAttachments.ts):
- `replace(key, file)`: revoke old object URL if owned; keep `name`; set `storageId: null, file` so `upload()` re-uploads edited content. Hydrated draft attachments (`storageId` set, `file === null`) open **read-only** — editing would orphan the stored blob.

## Part 5 — `TextAttachmentModal`

New: `apps/web/src/lib/components/attachments/TextAttachmentModal.tsx`.

- Props: `{ title, text, readOnly, onSave?, onClose }`.
- **Opener fetches the text** in the click handler (`(await fetch(url)).text()` or `file.text()`), stores `{...} | null` state, renders modal only when non-null → fresh mount per open, no useEffect-fetch. Fetch failure: `toast.error("Could not load attachment.")`, modal doesn't open.
- Internal `const [draft, setDraft] = useState(text)`. Counts inline, live: `words = draft.trim() === "" ? 0 : draft.trim().split(/\s+/).length` · `draft.length` chars.
- Layout: `Dialog` → `DialogContent` → `DialogHeader`/`DialogTitle` → `DialogBody` with fixed-height scrollable `<textarea className="h-64 w-full resize-none rounded-surface border border-border ... font-mono">` (`readOnly` attr in viewer mode) + counts line → `DialogFooter`: Close (read-only) or Cancel + Save (Save disabled on empty draft; deletion stays on the chip X).

## Part 6 — Chip click wiring

- **[ChatAttachmentPreview](apps/web/src/lib/components/chat/imageAttachments.tsx)** (pre-send): every non-image chip becomes a `<button>` (accept list ⇒ non-image = text-family). Click fetches `file.url` → opens modal; `onSave` → `attachments.replace(id, new File([text], filename ?? "pasted-text.txt", { type: mediaType || "text/plain" }))`. If the file crosses ~250 lines, split `UserMessageAttachments` into its own file.
- **`UserMessageAttachments`** (sent messages): non-image chips change `<a download>` → `<button>` opening the modal read-only, title from `labelForAttachment` (filenames aren't persisted — "notes.txt" fallback, same as today's chip label). Image thumbs stay links.
- **Quick task**: [AttachmentCard.tsx](apps/web/src/lib/components/attachments/AttachmentCard.tsx) gets optional `onOpen`; [TaskFilesSection.tsx](apps/web/src/lib/components/quick-tasks/_components/TaskFilesSection.tsx) opens the modal for non-image items (`file.text()` local / fetch for hydrated), read-only for hydrated drafts, `onSave` → new `onReplace` prop threaded from QuickTaskModal.

## Order

1. Part 1 unification (lands green standalone)
2. Part 2 helpers
3. Part 4 replace (packages/ui then useTaskAttachments)
4. Part 5 modal
5. Part 6 chip wiring
6. Part 3 paste interception
7. `/changelog`, then `/ship`

## Verification

- `npx tsc --noEmit` in `apps/web` and `packages/ui`. No backend changes → no convex codegen.
- Manual per surface (sessions, new-session, quick task, project sandbox, task sandbox): 2,001-char paste → chip, input empty; 1,999 → inline. Chip → modal counts correct; edit/Save persists; Cancel discards. 5 attachments + paste → inline fall-through. Send → sent chip opens read-only viewer; agent sees `/tmp/eva-attachment-N.txt` with edited content. Sandbox chats now accept `.md` via picker. Regressions: image paste, drag-drop, stash restore, queued message with attachment.

## Edge cases

- At-cap paste falls through to inline insert (no data loss).
- Empty edit: Save disabled.
- Rich-text clipboards become plain text (text/plain flavour — same as today).
- Pre-send attachments are not draft-persisted (existing behaviour, unchanged).
- New components: no useMemo/useCallback, no try-block value hazards (React Compiler).
