# t3code Diffs / Files → Eva adoption ideas

## Context

Eva session Diffs/Files already cover PR unified/split diffs, `@pierre/trees` file tree, inline review comments → composer chips, and chat `ChangedFilesCard` → Diffs/Files. t3code’s right-panel Diffs/Files (Pierre `CodeView` / `Editor`, turn-aware scopes) still has several polish + capability gaps worth adopting later.

**t3code refs:** `DiffPanel.tsx`, `AnnotatableCodeView.tsx`, `FileBrowserPanel.tsx`, `FilePreviewPanel.tsx`, `ChangedFilesTree.tsx`  
**Eva refs:** `DiffsPanel.tsx`, `DiffFileTree`, `ReviewableFileDiff`, `FileViewerPanel`, session `SandboxTabBar` Files tab

---

## Already covered (skip)

- PR-based diffs + split/unified (URL state)
- Diff file tree with status colors
- Inline line-selection review comments → pending chips → prompt
- Chat changed-files card → open Diffs / Files
- Full edit surface via code-server Editor tab (no need to port t3code’s in-panel Pierre editor as a first-class replacement)

---

## Priority ideas

### P1 — High leverage

1. **Sticky per-file headers + collapse in stacked Diffs**
   - Long PR diffs: keep file path sticky while scrolling; optional collapse per file.
   - t3code: Pierre `stickyHeaders` + per-file chevrons in multi-file `CodeView`.

2. **Diff → open in Files**
   - Click diff file title / action → Files tab with that path (`?file=`).
   - Complements chat→Files; closes the Diffs↔Files loop.

3. **Working-tree / branch diffs (not only PR)**
   - Show uncommitted sandbox changes and/or branch-vs-base without requiring a PR.
   - Biggest functional gap vs t3code’s working-tree / branch / turn scopes. Needs sandbox git + Convex actions.

### P2 — Medium

4. **Files tab: searchable tree**
   - Real explorer (hide-non-matches search), not chat-driven open-only.
   - t3code: `@pierre/trees` in `FileBrowserPanel`.

5. **Turn-scoped checkpoint diffs**
   - “What this agent turn changed” without a PR; chat View diff scopes to that turn + file.
   - Needs checkpoint/diff backend (L).

6. **+/- stats in Diffs tree**
   - Rolled-up add/delete counts per file (and folders if hierarchical).

7. **Wrap + ignore-whitespace toggles**
   - Header toggles; ignore-whitespace re-fetches/re-renders.

8. **Line reveal in Files**
   - Open `path:line` from activity/chat and scroll/highlight that line.

### P3 — Nice / later

9. Diff worker pool for large tokenization (off main thread).
10. Markdown preview mode in Files (if we keep Eva-native viewer vs code-server).
11. File-level review comments (not only on diffs) — same gutter → composer pipeline.
12. Word-level / intra-line diffs — low priority (t3code web mostly skips these too).

---

## Suggested first slice (when picked up)

1. Sticky file headers (+ optional collapse) in `DiffsPanel` stacked view.
2. Diff file → Files tab deep-link.
3. Decide separately whether working-tree diffs are worth the backend cost vs PR-only.

---

## Out of scope for now

- Replacing code-server with Pierre in-panel editor
- GitHub PR review-thread sync (Eva comments stay prompt-local)
- Blame / stage-unstage UI
