"use client";

import { useShortcut } from "@/lib/hotkeys/useShortcut";

/**
 * Registers `submitComposerForm` (default Mod+Enter) only while mounted.
 * Render this from a dialog that is actually open — both create-task and
 * create-project used to call `useShortcut` on mount, so a page that kept
 * both modals in the tree (QuickTaskModal always nests NewProjectModal)
 * logged `'Mod+Enter' is already registered` and fired both handlers.
 *
 * `conflictBehavior: 'replace'` is the last-mount-wins fallback if two
 * open dialogs ever overlap (project-from-task). `enabled` is not used:
 * an enabled:false registration still occupies the combo.
 */
export function ComposerFormSubmitHotkey({
  canSubmit,
  onSubmit,
}: {
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  useShortcut(
    "submitComposerForm",
    (event) => {
      event.preventDefault();
      if (canSubmit) onSubmit();
    },
    { conflictBehavior: "replace" },
  );
  return null;
}
