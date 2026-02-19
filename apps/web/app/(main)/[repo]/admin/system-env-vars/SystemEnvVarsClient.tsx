"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Spinner,
} from "@conductor/ui";
import {
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconServer,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

type Category = "claude_oauth" | "infrastructure";

const CATEGORY_LABELS: Record<Category, string> = {
  claude_oauth: "OAuth Token",
  infrastructure: "Infrastructure",
};

export function SystemEnvVarsClient() {
  const isAdmin = useQuery(api.auth.isCurrentUserAdmin);
  const vars = useQuery(api.systemEnvVars.list);
  const upsertVar = useAction(api.systemEnvVarsActions.upsertVar);
  const revealValue = useAction(api.systemEnvVarsActions.revealValue);
  const removeVar = useMutation(api.systemEnvVars.removeVar);

  const [adding, setAdding] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<Category>("claude_oauth");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const [revealedValues, setRevealedValues] = useState<Record<string, string>>(
    {},
  );
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (isAdmin === false) {
    return (
      <PageWrapper title="System Variables">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconServer size={48} className="mb-3 opacity-40" />
          <p className="text-sm">Access denied. Admin privileges required.</p>
        </div>
      </PageWrapper>
    );
  }

  const startAdd = () => {
    setAdding(true);
    setKeyInput("");
    setValueInput("");
    setCategoryInput("claude_oauth");
    setDescriptionInput("");
  };

  const cancelAdd = () => {
    setAdding(false);
    setKeyInput("");
    setValueInput("");
    setDescriptionInput("");
  };

  const handleAdd = async () => {
    if (!keyInput.trim() || !valueInput.trim()) return;
    setSaving(true);
    await upsertVar({
      key: keyInput.trim(),
      value: valueInput,
      category: categoryInput,
      description: descriptionInput.trim() || undefined,
    });
    setSaving(false);
    cancelAdd();
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
    if (!editingKey || !editValue.trim()) return;
    const existing = vars?.find((v) => v.key === editingKey);
    if (!existing) return;
    setSaving(true);
    await upsertVar({
      key: editingKey,
      value: editValue,
      category: existing.category,
      description: existing.description,
    });
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
    if (!deleteKey) return;
    await removeVar({ key: deleteKey });
    setRevealedValues((prev) => {
      const next = { ...prev };
      delete next[deleteKey];
      return next;
    });
    setDeleteKey(null);
  };

  const toggleReveal = async (key: string) => {
    if (revealedValues[key] !== undefined) {
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setRevealingKey(key);
    const value = await revealValue({ key });
    if (value !== null) {
      setRevealedValues((prev) => ({ ...prev, [key]: value }));
    }
    setRevealingKey(null);
  };

  const copyValue = async (key: string) => {
    let value = revealedValues[key];
    if (value === undefined) {
      const result = await revealValue({ key });
      if (result === null) return;
      value = result;
    }
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const showTable = (vars && vars.length > 0) || adding;

  return (
    <PageWrapper
      title="System Variables"
      headerRight={
        <Button size="sm" onClick={startAdd} disabled={adding}>
          <IconPlus size={16} className="mr-1.5" />
          Add Variable
        </Button>
      }
    >
      {vars === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !showTable ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconServer size={48} className="mb-3 opacity-40" />
          <p className="text-sm">No system variables configured</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Add OAuth tokens and infrastructure variables for sandbox execution.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Key</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr className="border-b border-border/40">
                  <td className="px-4 py-2.5">
                    <Input
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="e.g. CLAUDE_CODE_OAUTH_TOKEN"
                      className="h-7 font-mono text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelAdd();
                      }}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={categoryInput}
                      onChange={(e) =>
                        setCategoryInput(e.target.value as Category)
                      }
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="claude_oauth">OAuth Token</option>
                      <option value="infrastructure">Infrastructure</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      placeholder="Optional description"
                      className="h-7 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelAdd();
                      }}
                    />
                  </td>
                  <td className="px-4 py-2.5">
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
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={handleAdd}
                        disabled={
                          !keyInput.trim() || !valueInput.trim() || saving
                        }
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
              )}
              {vars.map((v) => (
                <tr
                  key={v.key}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-xs">{v.key}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {CATEGORY_LABELS[v.category]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {v.description || "—"}
                  </td>
                  <td className="px-4 py-2.5">
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
                  <td className="px-4 py-2.5 text-right">
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
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={deleteKey !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete System Variable</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-mono font-medium text-foreground">
              {deleteKey}
            </span>
            ? This will also remove any linked account status. This cannot be
            undone.
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
    </PageWrapper>
  );
}
