"use client";

import { Switch } from "@eva/ui";

interface AuditToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/** On/off task default for running an audit after a run. */
export function AuditToggle({ value, onChange, disabled }: AuditToggleProps) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-muted-foreground">
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label="Run audit"
      />
      <span className={value ? "text-foreground" : undefined}>Audit</span>
    </label>
  );
}
