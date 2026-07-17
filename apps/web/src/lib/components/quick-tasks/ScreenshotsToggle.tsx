"use client";

import { IconCamera, IconCameraOff } from "@tabler/icons-react";
import {
  TriStateOverrideToggle,
  type TriStateValue,
} from "./TriStateOverrideToggle";

export type ScreenshotsToggleValue = TriStateValue;

interface ScreenshotsToggleProps {
  value: ScreenshotsToggleValue;
  repoDefault: boolean;
  onChange: (next: ScreenshotsToggleValue) => void;
  disabled?: boolean;
}

/** Tri-state per-task override for the repo/project screenshots-videos default. */
export function ScreenshotsToggle({
  value,
  repoDefault,
  onChange,
  disabled,
}: ScreenshotsToggleProps) {
  return (
    <TriStateOverrideToggle
      label="Proof"
      value={value}
      inheritedDefault={repoDefault}
      onChange={onChange}
      onIcon={IconCamera}
      offIcon={IconCameraOff}
      disabled={disabled}
    />
  );
}
