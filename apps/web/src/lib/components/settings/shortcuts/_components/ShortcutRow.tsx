"use client";

import { Button } from "@eva/ui";
import { type Hotkey } from "@tanstack/react-hotkeys";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";
import { ShortcutRecorder } from "@/lib/components/settings/shortcuts/_components/ShortcutRecorder";
import { SHORTCUT_DEFS, type ShortcutId } from "@/lib/hotkeys/registry";

/** One rebindable shortcut: what it does, its current combo, and how to change it. */
export function ShortcutRow({
  id,
  binding,
  isOverridden,
  conflictsWith,
  onRecord,
}: {
  id: ShortcutId;
  binding: Hotkey;
  isOverridden: boolean;
  /** Names of other shortcuts sharing this combo, if any. */
  conflictsWith: ReadonlyArray<string>;
  onRecord: (hotkey: Hotkey | null) => void;
}) {
  const def = SHORTCUT_DEFS[id];

  return (
    <SettingsToggleRow
      title={def.name}
      description={
        <>
          {def.description}
          {conflictsWith.length > 0 ? (
            <span className="mt-1 block text-warning">
              Same combo as {conflictsWith.join(", ")}. Whichever is on screen
              wins.
            </span>
          ) : null}
        </>
      }
      action={
        <div className="flex items-start gap-2">
          <ShortcutRecorder def={def} binding={binding} onRecord={onRecord} />
          {isOverridden ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRecord(null)}
              aria-label={`Reset ${def.name} to its default`}
            >
              Reset
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
