"use client";

import { useState } from "react";
import { Button, Input, cn } from "@eva/ui";
import { IconCheck, IconX } from "@tabler/icons-react";
import { ENV_VAR_ROW_GRID } from "./rowGrid";

interface EnvVarAddRowProps {
  /** Resolves once the variable is stored; the parent then closes the row. */
  onSubmit: (key: string, value: string) => Promise<void>;
  onCancel: () => void;
  /** A multi-line paste into the key field is a `.env` file, not a key. */
  onMultilinePaste: (text: string) => void;
}

/** The inline "new variable" row, on the same column grid as the data rows. */
export function EnvVarAddRow({
  onSubmit,
  onCancel,
  onMultilinePaste,
}: EnvVarAddRowProps) {
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!keyInput.trim() || !valueInput.trim()) return;
    setSaving(true);
    await onSubmit(keyInput.trim(), valueInput);
    setSaving(false);
  };

  const handleKeyInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes("\n")) {
      e.preventDefault();
      onMultilinePaste(text);
    }
  };

  return (
    <div className={cn(ENV_VAR_ROW_GRID, "py-1.5")}>
      <Input
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        onPaste={handleKeyInputPaste}
        placeholder="e.g. API_KEY"
        className="h-7 font-mono text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <Input
        value={valueInput}
        onChange={(e) => setValueInput(e.target.value)}
        placeholder="Enter value"
        className="h-7 font-mono text-xs"
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center justify-end gap-0.5">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={submit}
          disabled={!keyInput.trim() || !valueInput.trim() || saving}
          title="Save"
          className="text-primary hover:text-primary"
        >
          <IconCheck size={14} />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onCancel} title="Cancel">
          <IconX size={14} />
        </Button>
      </div>
    </div>
  );
}
