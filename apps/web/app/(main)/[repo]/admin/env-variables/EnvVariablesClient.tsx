"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
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
  IconKey,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

function maskValue(value: string): string {
  if (value.length > 8) {
    return value.slice(0, 2) + "****" + value.slice(-4);
  }
  return "****";
}

export function EnvVariablesClient() {
  const { repoId } = useRepo();
  const vars = useQuery(api.repoEnvVars.list, { repoId });
  const upsertVar = useMutation(api.repoEnvVars.upsertVar);
  const removeVar = useMutation(api.repoEnvVars.removeVar);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const openAdd = () => {
    setKeyInput("");
    setValueInput("");
    setAddDialogOpen(true);
  };

  const handleAdd = async () => {
    if (!keyInput.trim() || !valueInput.trim()) return;
    setSaving(true);
    await upsertVar({ repoId, key: keyInput.trim(), value: valueInput });
    setSaving(false);
    setAddDialogOpen(false);
  };

  const startEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingKey || !editValue.trim()) return;
    setSaving(true);
    await upsertVar({ repoId, key: editingKey, value: editValue });
    setSaving(false);
    setEditingKey(null);
    setEditValue("");
  };

  const confirmDelete = async () => {
    if (!deleteKey) return;
    await removeVar({ repoId, key: deleteKey });
    setDeleteKey(null);
  };

  return (
    <PageWrapper
      title="Environment Variables"
      headerRight={
        <Button size="sm" onClick={openAdd}>
          <IconPlus size={16} className="mr-1.5" />
          Add Variable
        </Button>
      }
    >
      {vars === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : vars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconKey size={48} className="mb-3 opacity-40" />
          <p className="text-sm">No environment variables configured</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Variables are injected into sandboxes when sessions and workflows
            run.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Key</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vars.map((v) => (
                <tr
                  key={v.key}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-xs">{v.key}</td>
                  <td className="px-4 py-2.5">
                    {editingKey === v.key ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter value"
                        className="h-7 font-mono text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {maskValue(v.value)}
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
                          onClick={() => navigator.clipboard.writeText(v.value)}
                          title="Copy value"
                        >
                          <IconCopy size={14} />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEdit(v.key, v.value)}
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Variable</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Key
              </label>
              <Input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="e.g. API_KEY"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Value
              </label>
              <Input
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                placeholder="Enter value"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!keyInput.trim() || !valueInput.trim() || saving}
            >
              {saving ? "Saving..." : "Save"}
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
    </PageWrapper>
  );
}
