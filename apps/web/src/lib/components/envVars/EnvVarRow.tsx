"use client";

import { useState } from "react";
import { Button, Input, cn } from "@eva/ui";
import {
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";
import type { EnvVar } from "@/lib/components/EnvVarsTable";
import { ENV_VAR_ROW_GRID } from "./rowGrid";

/**
 * Reveal is a three-state affair, not two booleans: hidden, in-flight, or
 * showing a value we already fetched. Modelling it as a union means there is no
 * way to be "revealing" and "shown" at once.
 */
type RevealState =
  | { status: "hidden" }
  | { status: "revealing" }
  | { status: "shown"; value: string };

interface EnvVarRowProps {
  envVar: EnvVar;
  readOnly: boolean;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  onReveal?: (key: string) => Promise<string | null>;
  onToggleSandboxExclude?: (
    key: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  /** Deletion is confirmed by the parent, which owns the confirm dialog. */
  onRequestDelete: (key: string) => void;
}

/**
 * One dense row in the free-form env var list.
 *
 * Reveal / copy / edit state lives here rather than in a set of key-indexed maps
 * on the parent: each row only ever needs its own, and unmounting a deleted row
 * throws its revealed secret away for free.
 */
export function EnvVarRow({
  envVar,
  readOnly,
  onUpsert,
  onReveal,
  onToggleSandboxExclude,
  onRequestDelete,
}: EnvVarRowProps) {
  const [reveal, setReveal] = useState<RevealState>({ status: "hidden" });
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const isShown = reveal.status === "shown";

  const toggleReveal = async () => {
    if (!onReveal) return;
    if (reveal.status === "shown") {
      setReveal({ status: "hidden" });
      return;
    }
    setReveal({ status: "revealing" });
    const value = await onReveal(envVar.key);
    if (value === null) {
      setReveal({ status: "hidden" });
      return;
    }
    setReveal({ status: "shown", value });
  };

  const copyValue = async () => {
    if (!onReveal) return;
    let value: string;
    if (reveal.status === "shown") {
      value = reveal.value;
    } else {
      const result = await onReveal(envVar.key);
      if (result === null) return;
      value = result;
    }
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveEdit = async () => {
    if (editDraft === null || !editDraft.trim() || !onUpsert) return;
    setSaving(true);
    await onUpsert(envVar.key, editDraft, envVar.sandboxExclude);
    setSaving(false);
    setEditDraft(null);
    // The stored secret just changed, so anything revealed is now stale.
    setReveal({ status: "hidden" });
  };

  if (editDraft !== null) {
    return (
      <div className={cn(ENV_VAR_ROW_GRID, "py-1.5")}>
        <span className="truncate font-mono text-2sm text-foreground">
          {envVar.key}
        </span>
        <Input
          value={editDraft}
          onChange={(e) => setEditDraft(e.target.value)}
          placeholder="Enter new value"
          className="h-7 font-mono text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") setEditDraft(null);
          }}
        />
        <div className="flex items-center justify-end gap-0.5">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={saveEdit}
            disabled={!editDraft.trim() || saving}
            title="Save"
            className="text-primary hover:text-primary"
          >
            <IconCheck size={14} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setEditDraft(null)}
            title="Cancel"
          >
            <IconX size={14} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(ENV_VAR_ROW_GRID, "py-1.5")}>
      <span className="truncate font-mono text-2sm text-foreground">
        {envVar.key}
      </span>
      <span className="truncate font-mono text-2sm text-muted-foreground">
        {isShown ? reveal.value : envVar.value}
      </span>
      <div className="flex items-center justify-end gap-0.5">
        <Button
          size="icon-sm"
          variant="ghost"
          className="hit-target"
          onClick={toggleReveal}
          disabled={reveal.status === "revealing"}
          title={isShown ? "Hide value" : "Reveal value"}
        >
          <CrossfadeIcon
            show={isShown}
            trueKey="hide"
            falseKey="reveal"
            className="relative flex size-3.5 items-center justify-center"
            whenTrue={<IconEyeOff size={14} />}
            whenFalse={<IconEye size={14} />}
          />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="hit-target"
          onClick={copyValue}
          title={copied ? "Copied!" : "Copy value"}
        >
          <CrossfadeIcon
            show={copied}
            trueKey="copied"
            falseKey="copy"
            className="relative flex size-3.5 items-center justify-center"
            whenTrue={<IconCheck size={14} className="text-primary" />}
            whenFalse={<IconCopy size={14} />}
          />
        </Button>
        {readOnly ? null : (
          <>
            {onToggleSandboxExclude ? (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  onToggleSandboxExclude(envVar.key, !envVar.sandboxExclude)
                }
                title={
                  envVar.sandboxExclude
                    ? "Excluded from sandbox (click to include)"
                    : "Included in sandbox (click to exclude)"
                }
              >
                {envVar.sandboxExclude ? (
                  <IconLock size={14} className="text-warning" />
                ) : (
                  <IconLockOpen size={14} />
                )}
              </Button>
            ) : null}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setEditDraft("")}
              title="Edit"
            >
              <IconPencil size={14} />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onRequestDelete(envVar.key)}
              title="Delete"
              className="text-destructive hover:text-destructive"
            >
              <IconTrash size={14} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
