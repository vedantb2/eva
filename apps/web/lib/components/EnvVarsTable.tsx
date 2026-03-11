"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Spinner,
  Textarea,
} from "@conductor/ui";
import {
  IconCheck,
  IconClipboard,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

interface EnvVar {
  key: string;
  value: string;
  sandboxExclude: boolean;
}

interface EnvVarsTableProps {
  vars: EnvVar[] | undefined;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  onReveal?: (key: string) => Promise<string | null>;
  onRemove?: (key: string) => Promise<void>;
  onToggleSandboxExclude?: (
    key: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  description: string;
  readOnly?: boolean;
}

function parseEnvVars(text: string): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) result.push({ key, value });
  }

  return result;
}

export function EnvVarsTable({
  vars,
  onUpsert,
  onReveal,
  onRemove,
  onToggleSandboxExclude,
  description,
  readOnly = false,
}: EnvVarsTableProps) {
  const [adding, setAdding] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const [revealedValues, setRevealedValues] = useState<Record<string, string>>(
    {},
  );
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const startAdd = () => {
    setAdding(true);
    setKeyInput("");
    setValueInput("");
  };

  const cancelAdd = () => {
    setAdding(false);
    setKeyInput("");
    setValueInput("");
  };

  const handleAdd = async () => {
    if (!keyInput.trim() || !valueInput.trim() || !onUpsert) return;
    setSaving(true);
    await onUpsert(keyInput.trim(), valueInput, false);
    setSaving(false);
    setAdding(false);
    setKeyInput("");
    setValueInput("");
  };

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingKey || !editValue.trim() || !onUpsert) return;
    const existing = vars?.find((v) => v.key === editingKey);
    setSaving(true);
    await onUpsert(editingKey, editValue, existing?.sandboxExclude ?? false);
    setSaving(false);
    setEditingKey(null);
    setEditValue("");
    setRevealedValues((prev) => {
      const next = { ...prev };
      delete next[editingKey];
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deleteKey || !onRemove) return;
    await onRemove(deleteKey);
    setRevealedValues((prev) => {
      const next = { ...prev };
      delete next[deleteKey];
      return next;
    });
    setDeleteKey(null);
  };

  const toggleReveal = async (key: string) => {
    if (!onReveal) return;
    if (revealedValues[key] !== undefined) {
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setRevealingKey(key);
    const value = await onReveal(key);
    if (value !== null) {
      setRevealedValues((prev) => ({ ...prev, [key]: value }));
    }
    setRevealingKey(null);
  };

  const copyValue = async (key: string) => {
    if (!onReveal) return;
    let value = revealedValues[key];
    if (value === undefined) {
      const result = await onReveal(key);
      if (result === null) return;
      value = result;
    }
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleKeyInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes("\n")) {
      e.preventDefault();
      setBulkText(text);
      setShowBulkPaste(true);
      cancelAdd();
    }
  };

  const handleBulkImport = async () => {
    if (!onUpsert) return;
    const parsed = parseEnvVars(bulkText);
    if (parsed.length === 0) return;
    setBulkSaving(true);
    for (const { key, value } of parsed) {
      await onUpsert(key, value, false);
    }
    setBulkSaving(false);
    setShowBulkPaste(false);
    setBulkText("");
  };

  const parsedPreview = parseEnvVars(bulkText);
  const sandboxVars = vars?.filter((v) => !v.sandboxExclude) ?? [];
  const excludedVars = vars?.filter((v) => v.sandboxExclude) ?? [];
  const showTable = (vars && vars.length > 0) || adding;

  const renderRow = (v: EnvVar) => (
    <tr key={v.key} className="border-b border-border/40 last:border-0">
      <td className="px-2.5 py-2.5 font-mono text-xs sm:px-4">{v.key}</td>
      <td className="px-2.5 py-2.5 sm:px-4">
        {editingKey === v.key ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter new value"
            className="h-7 font-mono text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
          />
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {revealedValues[v.key] ?? v.value}
          </span>
        )}
      </td>
      <td className="px-2.5 py-2.5 text-right sm:px-4">
        {editingKey === v.key ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={saveEdit}
              disabled={!editValue.trim() || saving}
              title="Save"
              className="text-primary hover:text-primary"
            >
              <IconCheck size={14} />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={cancelEdit}
              title="Cancel"
            >
              <IconX size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => toggleReveal(v.key)}
              disabled={revealingKey === v.key}
              title={
                revealedValues[v.key] !== undefined
                  ? "Hide value"
                  : "Reveal value"
              }
            >
              {revealedValues[v.key] !== undefined ? (
                <IconEyeOff size={14} />
              ) : (
                <IconEye size={14} />
              )}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => copyValue(v.key)}
              title={copiedKey === v.key ? "Copied!" : "Copy value"}
            >
              {copiedKey === v.key ? (
                <IconCheck size={14} className="text-primary" />
              ) : (
                <IconCopy size={14} />
              )}
            </Button>
            {!readOnly && (
              <>
                {onToggleSandboxExclude && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() =>
                      onToggleSandboxExclude(v.key, !v.sandboxExclude)
                    }
                    title={
                      v.sandboxExclude
                        ? "Excluded from sandbox (click to include)"
                        : "Included in sandbox (click to exclude)"
                    }
                  >
                    {v.sandboxExclude ? (
                      <IconLock size={14} className="text-amber-500" />
                    ) : (
                      <IconLockOpen size={14} />
                    )}
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => startEdit(v.key)}
                  title="Edit"
                >
                  <IconPencil size={14} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteKey(v.key)}
                  title="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <IconTrash size={14} />
                </Button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );

  const tableHeader = (
    <thead>
      <tr className="border-b border-border/60 text-left text-muted-foreground">
        <th className="px-2.5 py-2.5 font-medium sm:px-4">Key</th>
        <th className="px-2.5 py-2.5 font-medium sm:px-4">Value</th>
        <th className="px-2.5 py-2.5 text-right font-medium sm:px-4">
          Actions
        </th>
      </tr>
    </thead>
  );

  const addingRow = adding ? (
    <tr className="border-b border-border/40">
      <td className="px-2.5 py-2.5 sm:px-4">
        <Input
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onPaste={handleKeyInputPaste}
          placeholder="e.g. API_KEY"
          className="h-7 font-mono text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelAdd();
          }}
        />
      </td>
      <td className="px-2.5 py-2.5 sm:px-4">
        <Input
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          placeholder="Enter value"
          className="h-7 font-mono text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") cancelAdd();
          }}
        />
      </td>
      <td className="px-2.5 py-2.5 text-right sm:px-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleAdd}
            disabled={!keyInput.trim() || !valueInput.trim() || saving}
            title="Save"
            className="text-primary hover:text-primary"
          >
            <IconCheck size={14} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={cancelAdd}
            title="Cancel"
          >
            <IconX size={14} />
          </Button>
        </div>
      </td>
    </tr>
  ) : null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>
        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkPaste(true)}
            >
              <IconClipboard size={16} className="mr-1.5" />
              Paste
            </Button>
            <Button size="sm" onClick={startAdd} disabled={adding}>
              <IconPlus size={16} className="mr-1.5" />
              Add Variable
            </Button>
          </div>
        )}
      </div>
      {vars === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !showTable ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconKey size={48} className="mb-3 opacity-40" />
          <p className="text-sm">No environment variables configured</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-border/70 overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              {tableHeader}
              <tbody>
                {addingRow}
                {sandboxVars.map(renderRow)}
                {sandboxVars.length === 0 && !adding && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-xs text-muted-foreground"
                    >
                      No sandbox variables
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {excludedVars.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <IconLock size={14} className="text-amber-500" />
                <p className="text-xs font-medium text-muted-foreground">
                  Excluded from Sandbox
                </p>
              </div>
              <div className="rounded-lg border border-border/70 overflow-x-auto">
                <table className="w-full text-sm min-w-[360px]">
                  {tableHeader}
                  <tbody>{excludedVars.map(renderRow)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={showBulkPaste}
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkPaste(false);
            setBulkText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Paste Environment Variables</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Paste your variables in{" "}
              <span className="font-mono">KEY=VALUE</span> format, one per line.
              Lines starting with <span className="font-mono">#</span> are
              ignored.
            </p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"API_KEY=abc123\nDATABASE_URL=postgres://..."}
              className="h-40 font-mono text-xs"
              autoFocus
            />
            {parsedPreview.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {parsedPreview.length} variable
                {parsedPreview.length !== 1 ? "s" : ""} detected
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowBulkPaste(false);
                setBulkText("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBulkImport}
              disabled={parsedPreview.length === 0 || bulkSaving}
            >
              {bulkSaving && <Spinner size="sm" className="mr-1.5" />}
              Import{" "}
              {parsedPreview.length > 0
                ? `${parsedPreview.length} Variable${parsedPreview.length !== 1 ? "s" : ""}`
                : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteKey !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variable</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-mono font-medium text-foreground">
              {deleteKey}
            </span>
            ? This cannot be undone.
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
