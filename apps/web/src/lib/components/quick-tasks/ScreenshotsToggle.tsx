"use client";

import { Switch } from "@eva/ui";

interface ScreenshotsToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/** On/off task default for capturing proof after a run. */
export function ScreenshotsToggle({
  value,
  onChange,
  disabled,
}: ScreenshotsToggleProps) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-muted-foreground">
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label="Capture proof"
      />
      <span className={value ? "text-foreground" : undefined}>Proof</span>
    </label>
  );
}
