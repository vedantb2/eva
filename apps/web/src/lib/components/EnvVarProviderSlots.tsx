"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from "@conductor/ui";
import {
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";
import type { EnvVar } from "@/lib/components/EnvVarsTable";
import {
  KNOWN_ENV_VARS,
  type KnownEnvVar,
} from "@/lib/components/_utils/knownEnvVars";

interface EnvVarProviderSlotsProps {
  vars: EnvVar[] | undefined;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  onReveal?: (key: string) => Promise<string | null>;
  onRemove?: (key: string) => Promise<void>;
  readOnly?: boolean;
}

/**
 * Dedicated paste-in slots for the coding-agent auth vars (Claude, Codex,
 * OpenCode, Cursor). Each slot writes to the same free-form store as the table
 * below via the shared onUpsert/onReveal/onRemove callbacks — no extra backend
 * surface. A slot is "configured" when any of the provider's keys is present.
 */
export function EnvVarProviderSlots({
  vars,
  onUpsert,
  onReveal,
  onRemove,
  readOnly = false,
}: EnvVarProviderSlotsProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const matchOf = (entry: KnownEnvVar): EnvVar | undefined =>
    vars?.find((v) => entry.matchKeys.includes(v.key));

  const save = async (entry: KnownEnvVar) => {
    const value = drafts[entry.provider] ?? "";
    if (!value.trim() || !onUpsert) return;
    setSavingProvider(entry.provider);
    await onUpsert(entry.primaryKey, value, false);
    setSavingProvider(null);
    setDrafts((prev) => ({ ...prev, [entry.provider]: "" }));
  };

  const saveEdit = async (entry: KnownEnvVar, matched: EnvVar) => {
    if (!editValue.trim() || !onUpsert) return;
    setSavingProvider(entry.provider);
    await onUpsert(matched.key, editValue, matched.sandboxExclude);
    setSavingProvider(null);
    setEditingProvider(null);
    setEditValue("");
    setRevealed((prev) => {
      const next = { ...prev };
      delete next[matched.key];
      return next;
    });
  };

  const toggleReveal = async (key: string) => {
    if (!onReveal) return;
    if (revealed[key] !== undefined) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setRevealingKey(key);
    const value = await onReveal(key);
    if (value !== null) setRevealed((prev) => ({ ...prev, [key]: value }));
    setRevealingKey(null);
  };

  const copyValue = async (key: string) => {
    if (!onReveal) return;
    let value = revealed[key];
    if (value === undefined) {
      const result = await onReveal(key);
      if (result === null) return;
      value = result;
    }
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const confirmDelete = async () => {
    if (!deleteKey || !onRemove) return;
    await onRemove(deleteKey);
    setRevealed((prev) => {
      const next = { ...prev };
      delete next[deleteKey];
      return next;
    });
    setDeleteKey(null);
  };

  const renderValueInput = (
    entry: KnownEnvVar,
    value: string,
    onChange: (v: string) => void,
    onSubmit: () => void,
    onCancel?: () => void,
  ) =>
    entry.multiline ? (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={entry.placeholder}
        className="h-20 font-mono text-xs"
        autoFocus={editingProvider === entry.provider}
      />
    ) : (
      <Input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={entry.placeholder}
        className="h-7 font-mono text-xs"
        autoFocus={editingProvider === entry.provider}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel?.();
        }}
      />
    );

  return (
    <div className="space-y-2">
      {KNOWN_ENV_VARS.map((entry) => {
        const matched = matchOf(entry);
        const configured = matched !== undefined;
        const isEditing = editingProvider === entry.provider;
        const busy = savingProvider === entry.provider;
        const Logo = entry.Logo;

        return (
          <div
            key={entry.provider}
            className="rounded-surface border border-border bg-muted/40 px-3 py-2.5"
          >
            <div className="flex items-start gap-3">
              <Logo size={20} className="mt-0.5 shrink-0 text-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entry.label}</span>
                  {configured && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <IconCheck size={10} /> Configured
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.hint}
                </p>

                {/* Unconfigured, editable: paste-in field. */}
                {!configured && !readOnly && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <div className="flex-1">
                      {renderValueInput(
                        entry,
                        drafts[entry.provider] ?? "",
                        (v) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [entry.provider]: v,
                          })),
                        () => save(entry),
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => save(entry)}
                      disabled={!(drafts[entry.provider] ?? "").trim() || busy}
                    >
                      Save
                    </Button>
                  </div>
                )}

                {/* Configured + editing: replace value. */}
                {configured && matched && isEditing && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <div className="flex-1">
                      {renderValueInput(
                        entry,
                        editValue,
                        setEditValue,
                        () => saveEdit(entry, matched),
                        () => {
                          setEditingProvider(null);
                          setEditValue("");
                        },
                      )}
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => saveEdit(entry, matched)}
                      disabled={!editValue.trim() || busy}
                      title="Save"
                      className="text-primary hover:text-primary"
                    >
                      <IconCheck size={14} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProvider(null);
                        setEditValue("");
                      }}
                      title="Cancel"
                    >
                      <IconX size={14} />
                    </Button>
                  </div>
                )}

                {/* Configured, not editing: show masked/revealed value. */}
                {configured && matched && !isEditing && (
                  <div className="mt-1.5">
                    {revealed[matched.key] !== undefined && (
                      <pre className="mb-1 max-h-24 overflow-auto rounded border border-border bg-background px-2 py-1 font-mono text-[11px] break-all whitespace-pre-wrap">
                        {revealed[matched.key]}
                      </pre>
                    )}
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {matched.key}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons for configured, non-editing slots. */}
              {configured && matched && !isEditing && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => toggleReveal(matched.key)}
                    disabled={revealingKey === matched.key}
                    title={
                      revealed[matched.key] !== undefined
                        ? "Hide value"
                        : "Reveal value"
                    }
                  >
                    <CrossfadeIcon
                      show={revealed[matched.key] !== undefined}
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
                    onClick={() => copyValue(matched.key)}
                    title={copiedKey === matched.key ? "Copied!" : "Copy value"}
                  >
                    <CrossfadeIcon
                      show={copiedKey === matched.key}
                      trueKey="copied"
                      falseKey="copy"
                      className="relative flex size-3.5 items-center justify-center"
                      whenTrue={
                        <IconCheck size={14} className="text-primary" />
                      }
                      whenFalse={<IconCopy size={14} />}
                    />
                  </Button>
                  {!readOnly && (
                    <>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingProvider(entry.provider);
                          setEditValue("");
                        }}
                        title="Replace value"
                      >
                        <IconPencil size={14} />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDeleteKey(matched.key)}
                        title="Remove"
                        className="text-destructive hover:text-destructive"
                      >
                        <IconTrash size={14} />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <Dialog
        open={deleteKey !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Variable</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove{" "}
            <span className="font-mono font-medium text-foreground">
              {deleteKey}
            </span>
            ? The agent it enables will stop working until you paste it again.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteKey(null)}
            >
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
