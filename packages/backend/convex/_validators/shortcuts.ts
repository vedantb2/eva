import { v } from "convex/values";

/**
 * Every rebindable app-level keyboard shortcut (settings → Shortcuts).
 *
 * This list is the single source of truth for shortcut *identity*. The human
 * labels, descriptions, groupings, and default key combos live client-side in
 * `apps/web/src/lib/hotkeys/registry.ts`, which types itself against
 * `ShortcutId` so every id here is guaranteed to have metadata there.
 *
 * Element-scoped editing keys (Enter to submit, Escape to cancel, arrow-key
 * navigation) are deliberately absent — rebinding those breaks form
 * accessibility and IME composition, so they stay fixed.
 *
 * To add a shortcut: add one `v.literal(...)` line below, then fill in the
 * entry TypeScript will now demand in `SHORTCUT_DEFS`, then call
 * `useShortcut("yourId", …)` where it fires. To remove one, delete the line and
 * follow the same two type errors. Nothing else needs touching — the id array,
 * the `ShortcutId` type, and the mutation arg all derive from this union.
 */
export const shortcutIdValidator = v.union(
  v.literal("openSearch"),
  v.literal("toggleSidebar"),
  v.literal("toggleSandboxPanel"),
  v.literal("jumpToApp"),
  v.literal("newQuickTask"),
  v.literal("cycleSessionMode"),
  v.literal("stashDraft"),
  v.literal("submitComposerForm"),
  v.literal("toggleBrowserTab"),
  v.literal("toggleFilesTab"),
  v.literal("cycleSandboxTab"),
  v.literal("togglePreviewConsole"),
);

export type ShortcutId = (typeof shortcutIdValidator)["type"];

/** The same ids as an iterable list, in declaration order. */
export const SHORTCUT_IDS: ReadonlyArray<ShortcutId> =
  shortcutIdValidator.members.map((member) => member.value);

/**
 * Stored shape on `users.shortcutOverrides` — a sparse map of shortcut id to
 * hotkey string (e.g. `{ toggleSidebar: "Mod+Shift+I" }`). A missing key means
 * "use the client default", so the schema never changes when a shortcut is
 * added. Ids are validated on write via `shortcutIdValidator`; the hotkey
 * string is validated on read by the client's `isHotkey` guard.
 */
export const shortcutOverridesValidator = v.record(v.string(), v.string());
