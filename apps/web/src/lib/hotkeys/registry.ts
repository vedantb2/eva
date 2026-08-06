import { validateHotkey, type Hotkey } from "@tanstack/react-hotkeys";
import { SHORTCUT_IDS, type ShortcutId } from "@eva/backend";

export { SHORTCUT_IDS };
export type { ShortcutId };

/** Section headings on the Shortcuts settings page, in render order. */
export const SHORTCUT_GROUPS = [
  "Global",
  "Navigation",
  "Chat",
  "Sandbox",
] as const;

export type ShortcutGroup = (typeof SHORTCUT_GROUPS)[number];

export interface ShortcutDef {
  /** Row title on the settings page. */
  name: string;
  /** Row subtitle: what pressing the key actually does. */
  description: string;
  group: ShortcutGroup;
  /** The combo in force until the user rebinds it. */
  defaultHotkey: Hotkey;
  /**
   * Set only for shortcuts that occupy a run of numbered slots (the rail's
   * "jump to app N"). The binding's key must be a digit, and slots 2..N derive
   * their combo by substituting that digit.
   */
  slots?: number;
}

/**
 * Every rebindable shortcut, keyed by the id declared in the backend
 * validator. Typing this as a total `Record<ShortcutId, …>` means TypeScript
 * fails the build if an id is added there without metadata here.
 */
export const SHORTCUT_DEFS: Record<ShortcutId, ShortcutDef> = {
  openSearch: {
    name: "Open search",
    description: "Toggle the spotlight search dialog.",
    group: "Global",
    defaultHotkey: "Mod+K",
  },
  toggleSidebar: {
    name: "Toggle sidebar",
    description: "Collapse or expand the left sidebar.",
    group: "Global",
    defaultHotkey: "Mod+I",
  },
  toggleSandboxPanel: {
    name: "Toggle sandbox panel",
    description: "Show or hide the right-hand sandbox panel.",
    group: "Global",
    defaultHotkey: "Control+Alt+B",
  },
  jumpToApp: {
    name: "Jump to app 1–9",
    description:
      "Open the first to ninth app in the rail. The key must be a digit; the other eight slots follow the same modifiers.",
    group: "Navigation",
    defaultHotkey: "Alt+1",
    slots: 9,
  },
  newQuickTask: {
    name: "New quick task",
    description: "Open the new quick task dialog.",
    group: "Navigation",
    defaultHotkey: "Alt+N",
  },
  cycleSessionMode: {
    name: "Cycle session mode",
    description: "Step the composer through edit, plan, and design.",
    group: "Chat",
    defaultHotkey: "Mod+Shift+Tab",
  },
  stashDraft: {
    name: "Stash composer draft",
    description:
      "Stash the current draft. With an empty composer, opens the stash list.",
    group: "Chat",
    defaultHotkey: "Mod+S",
  },
  submitComposerForm: {
    name: "Submit form",
    description: "Submit the quick task and new project dialogs.",
    group: "Chat",
    defaultHotkey: "Mod+Enter",
  },
  toggleBrowserTab: {
    name: "Toggle Browser tab",
    description: "Switch to the Browser tab, or back to the previous one.",
    group: "Sandbox",
    defaultHotkey: "Mod+Shift+B",
  },
  toggleFilesTab: {
    name: "Toggle Files tab",
    description: "Switch to the Files tab, or back to the previous one.",
    group: "Sandbox",
    defaultHotkey: "Mod+P",
  },
  cycleSandboxTab: {
    name: "Cycle sandbox tabs",
    description:
      "Step through the open sandbox tabs. Rebind to Shift+Tab to restore the old default.",
    group: "Sandbox",
    // Sits in the same Control+Alt family as the panel toggle. Shift+punctuation
    // is deliberately unavailable — it is keyboard-layout dependent.
    defaultHotkey: "Control+Alt+ArrowRight",
  },
  togglePreviewConsole: {
    name: "Toggle preview console",
    description:
      "Open or close the console dock, switching to Preview if needed.",
    group: "Sandbox",
    defaultHotkey: "Mod+J",
  },
};

/** Shortcut ids belonging to a group, in registry order. */
export function shortcutIdsInGroup(group: ShortcutGroup): ShortcutId[] {
  return SHORTCUT_IDS.filter((id) => SHORTCUT_DEFS[id].group === group);
}

/**
 * Parses an arbitrary string into the library's `Hotkey` union. Convex stores
 * overrides as plain strings, so this is the boundary that keeps a bad or
 * stale value from reaching `useHotkey` — and keeps the codebase free of casts.
 */
export function isHotkey(value: string): value is Hotkey {
  return validateHotkey(value).valid;
}

/** The combo currently in force for a shortcut: valid override, else default. */
export function resolveBinding(
  id: ShortcutId,
  overrides: Record<string, string> | undefined,
): Hotkey {
  const override = overrides?.[id];
  if (override !== undefined && isHotkey(override)) return override;
  return SHORTCUT_DEFS[id].defaultHotkey;
}

/** The digit a slotted binding ends with, or null when it does not end in one. */
export function slotDigitOf(hotkey: Hotkey): number | null {
  const digit = Number(hotkey.slice(-1));
  if (!Number.isInteger(digit) || digit < 1 || digit > 9) return null;
  return digit;
}

/**
 * Rewrites a slotted binding for a different slot: `Alt+1` at slot 3 becomes
 * `Alt+3`. Returns null when the binding does not end in a digit, so callers
 * can skip registering that slot rather than register a nonsense combo.
 */
export function deriveSlotHotkey(base: Hotkey, slot: number): Hotkey | null {
  if (slotDigitOf(base) === null) return null;
  const candidate = `${base.slice(0, -1)}${slot}`;
  return isHotkey(candidate) ? candidate : null;
}
