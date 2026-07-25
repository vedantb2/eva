# Synara → Eva adoption ideas

## Context

[Synara](https://github.com/Emanuele-web04/synara) is a **local-first desktop** workspace for coding agents (Claude Code, Codex, Cursor, OpenCode, Grok, etc.): chats, terminals, browser previews, diffs, branches, **provider handoffs**, and **git worktrees** in one window ([README](https://github.com/Emanuele-web04/synara)).

**Stack:** `apps/web` (React 19 + Vite + TanStack Router/Query — almost all UX) + `apps/desktop` (Electron shell) + `apps/server` (Effect + SQLite, local WS/RPC). UI patterns often rhyme with t3code (MessagesTimeline, DiffPanel, MessageTrail, Pierre diffs).

Related plans: [`t3code-diffs-files-adoption.md`](./t3code-diffs-files-adoption.md), [`opencode-web-adoption.md`](./opencode-web-adoption.md).

Eva already has: activity “Worked for” fold + Show N more, jump rail, last-turn scroll pin, PR Diffs + review→composer, Files/Editor/Terminal/Preview/Computer, PRD card + Plan Ready, queued messages, multi-model picker.

---

## Already covered / skip

- Settled-turn activity fold + tool overflow
- Scroll-to-end / jump rail (Synara’s MessageTrail is a polish upgrade only)
- PR diffs, file tree, inline review → composer
- Plan/PRD artifact surface
- Preview + console dock pairing

---

## Where Synara is uniquely strong (vs t3code / OpenCode)

| Area                     | Synara                                                      | Fit for Eva                                                       |
| ------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| **Parallel agents**      | Split view up to 2×2 + sidechat dock                        | Strategic — Eva is 1 session surface today                        |
| **Provider handoff**     | Clone thread to another provider with context               | Strategic — multi-model, same sandbox                             |
| **Worktrees**            | Per-thread git worktree create/reuse                        | Partial — Eva uses remote sandboxes/branches, not local worktrees |
| **Environment hub**      | One overlay: branch, pins, notes, PR, usage, open-in-editor | Medium — Eva chrome is scattered                                  |
| **Composer queue steer** | Steer / Edit / Delete on queued turns                       | Medium — Eva queues but weaker interrupt semantics                |
| **Automations / kanban** | Built-in dispatch                                           | Out of scope unless Eva expands ops UX                            |

---

## Priority ideas for Eva

### P1 — Practical UI borrows

1. **Sticky per-file diff headers**
   - Path: `apps/web/src/lib/diffRendering.ts`
   - Effort: **S** — same as t3code Diffs P1; do once

2. **Multi-scope diffs (working tree / staged / branch / turn)**
   - Paths: `DiffPanel.logic.ts`, `repoDiffScopeStore.ts`
   - Effort: **M–L** — needs sandbox git; shared with t3code plan

3. **Composer stacked panels + steer queue**
   - Paths: `ComposerStackedPanel.tsx`, `QueuedComposerActions.tsx`
   - Effort: **M** — unify Plan Ready / review chips / queue into a dock stack; explicit Steer vs queue

4. **Composer footer degradation tiers**
   - Path: `composerFooterLayout.ts`
   - Effort: **S** — context meter / traits / model name collapse by measured overflow

5. **Environment / session hub panel**
   - Path: `EnvironmentPanel.tsx`
   - Effort: **M–L** — one place for branch, PR, open PRD, pins, sandbox status

### P2 — Timeline / dock polish

6. **MessageTrail magnification polish** on Eva jump rail
   - Path: `MessageTrail.tsx`
   - Effort: **S–M**

7. **Right-dock multi-pane model** (keep-mounted terminals when tabbing)
   - Path: `RightDock.tsx`
   - Effort: **L** — Eva sandbox tabs are close; optional keep-mounted refinement

8. **Browser screenshot → composer attachment**
   - Paths: `BrowserPanel.tsx`, `lib/browserPromptContext.ts`
   - Effort: **M** — pairs with preview-annotations plan

9. **Workspace explorer drag path → composer**
   - Path: `workspaceExplorer.tsx`
   - Effort: **M** — Files tree + attach path chip

### P3 — Strategic (product bets, not polish)

10. **Split-view parallel sessions** (2 chats side-by-side)
    - Paths: `splitViewStore.ts`, `_chat.$threadId.tsx`
    - Effort: **L**

11. **Cross-provider session handoff** (same sandbox, new model/provider, carry transcript)
    - Paths: `useThreadHandoff.ts`, `lib/threadHandoff.ts`
    - Effort: **L**

12. **Worktree / branch isolation UX** for parallel agents
    - Paths: `packages/shared/src/worktreeHandoff.ts`, `ThreadWorktreeHandoffDialog.tsx`
    - Effort: **L** — map to Eva sandboxes + branches, not local git worktrees

---

## Suggested first slices

1. Sticky Diffs headers (shared with t3code Diffs plan).
2. Composer footer overflow tiers + stacked interrupt strip (queue/plan/review).
3. Decide separately: session hub vs provider handoff vs split view (product, not UI polish).

---

## Out of scope for now

- Electron / local SQLite architecture
- Native embedded browser (Eva uses sandbox preview / noVNC)
- Full kanban/automations product surface
- Replacing Eva’s remote sandbox model with local worktrees
