# Collaborative Documents: Presence + Real-time Editing

## Context

Documents section is a PRD management tool (title, description, requirements, user flows). Currently single-user with plain `<Textarea>` for description. All collaborative infrastructure is already installed and configured:

- `@convex-dev/presence` v0.3.0 — backend functions in `packages/backend/convex/presence.ts`
- `@convex-dev/prosemirror-sync` v0.2.1 — backend functions in `packages/backend/convex/prosemirrorSync.ts`
- Tiptap v3.20.1 — existing non-collaborative editor in `FormattedText.tsx`
- Both components registered in `convex.config.ts`

**Goal:** Add facepile presence + collaborative rich text description editor + field-level focus indicators for structured sections.

---

## Step 1: Presence Facepile on Document Page

**Files:**

- `apps/web-v2/src/lib/components/docs/DocViewer.tsx`
- `apps/web/lib/components/docs/DocViewer.tsx`
- New: `apps/web-v2/src/lib/components/docs/_components/PresenceFacepile.tsx`
- New: `apps/web/lib/components/docs/_components/PresenceFacepile.tsx`

**What:**

- Import `usePresence` from `@convex-dev/presence/react`
- Call `usePresence(api.presence, doc._id, currentUser.id)` in DocViewer
- Build `PresenceFacepile` component — overlapping avatar circles with tooltip showing name
- Place in doc header next to the title/timestamp area
- Need current user info — check how auth/user data is accessed in the app

**Notes:**

- Don't use built-in `FacePile` component — build custom to match design system (no shadows, tonal hierarchy)
- Presence state includes `userId`, `online`, `lastDisconnected` — resolve user avatars/names from the `users` table
- Query users table to get name + image for each present userId

---

## Step 2: Collaborative Description Editor

**Files:**

- `apps/web-v2/src/lib/components/docs/DocViewer.tsx` (replace `<Textarea>`)
- `apps/web/lib/components/docs/DocViewer.tsx` (same)
- New: `apps/web-v2/src/lib/components/docs/_components/CollaborativeEditor.tsx`
- New: `apps/web/lib/components/docs/_components/CollaborativeEditor.tsx`
- `packages/backend/convex/prosemirrorSync.ts` (add auth checks, onSnapshot callback)
- `packages/backend/convex/docs.ts` (add helper to seed prosemirror doc from existing description)

**What:**

- Create `CollaborativeEditor` component using `useTiptapSync(api.prosemirrorSync, docId)`
- Extensions: `StarterKit` + `Underline` (matching existing FormattedText.tsx)
- Handle 3 states from `useTiptapSync`: loading, no doc yet (create), editor ready
- On first open of existing doc: create prosemirror doc from existing `description` text
- Add `onSnapshot` callback in backend to keep `docs.description` field in sync (for search/display in sidebar)
- Prosemirror doc ID: use `doc._id` string as the sync document ID

**Migration of existing data (auto-migrate silently):**

- When `useTiptapSync` returns `initialContent === null` (no prosemirror doc), check if `doc.description` has content
- If yes, call `sync.create()` with a ProseMirror doc built from the plain text
- If no, call `sync.create()` with an empty doc
- No user prompt — seamless migration on first open

**Backend changes to prosemirrorSync.ts:**

- Add `checkRead`/`checkWrite` auth callbacks to `syncApi()` (currently none)
- Add `onSnapshot` callback that updates `docs.description` with plain text extraction

---

## Step 3: Field-Level Focus Indicators

**Files:**

- `apps/web-v2/src/lib/components/docs/DocViewer.tsx`
- `apps/web/lib/components/docs/DocViewer.tsx`
- `packages/backend/convex/presence.ts` (may need `updateRoomUser` exposed)

**What:**

- Use presence `data` field to broadcast which field the user is focused on
- Track focus state: `{ field: "requirement", index: 2 }` or `{ field: "flowStep", flowIndex: 0, stepIndex: 1 }`
- On input focus → update presence data with current field
- On blur → clear field data
- Render: colored left border or subtle background highlight on rows other users are focused on, with small avatar badge
- Use the user's assigned color (derived from user ID hash) for the highlight

**Approach:**

- Presence room = `doc._id` (same room as facepile)
- Presence data carries the focused field info
- Other users' focus state read from `presenceState` array, filtered to exclude self

---

## Verification

1. Open same document in two browser tabs with different users
2. Verify facepile shows both users' avatars
3. Type in description editor in tab 1 → see changes appear in tab 2 in real-time
4. Click on a requirement field in tab 1 → see focus indicator appear in tab 2
5. Close a tab → verify user disappears from facepile
6. Open a document with existing plain text description → verify it migrates to collaborative editor correctly
7. Run `cd packages/backend && npx convex codegen --typecheck enable` to verify no type errors
