"use client";

import { IconChecklist, IconClipboardOff } from "@tabler/icons-react";
import {
  TriStateOverrideToggle,
  type TriStateValue,
} from "./TriStateOverrideToggle";

export type AuditToggleValue = TriStateValue;

interface AuditToggleProps {
  value: AuditToggleValue;
  /** Resolved default when inherited (project default, else "project tasks audit"). */
  inheritedDefault: boolean;
  onChange: (next: AuditToggleValue) => void;
  disabled?: boolean;
}

/** Tri-state per-task/project override for whether an audit runs after a run. */
export function AuditToggle({
  value,
  inheritedDefault,
  onChange,
  disabled,
}: AuditToggleProps) {
  return (
    <TriStateOverrideToggle
      label="Audit"
      value={value}
      inheritedDefault={inheritedDefault}
      onChange={onChange}
      onIcon={IconChecklist}
      offIcon={IconClipboardOff}
      disabled={disabled}
    />
  );
}
