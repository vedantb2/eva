# Prompt stash vs drafts

Two different composer persistence products — keep them on separate tables.

## Drafts (`drafts`)

- **What:** the single live WIP for one input surface (session chat, project chat, task chat, task comment).
- **Cardinality:** one row per `(user, surface target)` — upsert; empty content deletes the row.
- **Lifecycle:** autosaved on every keystroke; restored when you reopen that surface.
- **Scope key:** `sessionId` / `projectId` / `taskId` (+ comment parent), not "the whole app".
- **Contents today:** tokenized text only (attachments are not persisted on drafts yet).

Many drafts can exist inside one app because each session/task/project has its own surface — that is still not a stash queue.

## Prompt stashes (`promptStashes`)

- **What:** an explicit queue of frozen composer snapshots (git-stash for the prompt).
- **Cardinality:** many rows per `(user, repo)`, capped (20); oldest evicted.
- **Lifecycle:** ⌘S saves and clears the composer; restore appends into the current draft and **consumes** the entry.
- **Scope key:** per-user per-repo (shared across new-session + in-session composers for that app).
- **Contents:** tokenized text + optional Convex attachment storage IDs.
- **Does not touch:** model, mode, traits, or account selection on restore.

## Why not one table

Merging would force drafts to grow multi-row queue semantics, blob eviction, and "is this a WIP or a frozen snapshot?" branches on every draft read/write — while stash would inherit surface-target FKs it does not use. Share upload/tokenize/restore helpers if useful; keep the tables and APIs separate.
