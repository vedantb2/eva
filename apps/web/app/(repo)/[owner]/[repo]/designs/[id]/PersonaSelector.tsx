"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@conductor/ui";
import { IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";

export function PersonaDropdown({
  repoId,
  value,
  onChange,
}: {
  repoId: Id<"githubRepos">;
  value: Id<"designPersonas"> | undefined;
  onChange: (personaId: Id<"designPersonas"> | undefined) => void;
}) {
  const personas = useQuery(api.designPersonas.list, { repoId });

  return (
    <Select
      value={value ?? "none"}
      onValueChange={(val) => {
        const persona = personas?.find((p) => p._id === val);
        onChange(persona?._id);
      }}
    >
      <SelectTrigger className="h-7 w-auto gap-1.5 border-none bg-transparent text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground">
        <SelectValue placeholder="No persona" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No persona</SelectItem>
        {personas?.map((p) => (
          <SelectItem key={p._id} value={p._id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ManagePersonasModal({
  repoId,
  selectedPersonaId,
  onClearPersona,
}: {
  repoId: Id<"githubRepos">;
  selectedPersonaId?: Id<"designPersonas">;
  onClearPersona: () => void;
}) {
  const personas = useQuery(api.designPersonas.list, { repoId });
  const createPersona = useMutation(api.designPersonas.create);
  const updatePersona = useMutation(api.designPersonas.update);
  const removePersona = useMutation(api.designPersonas.remove);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"designPersonas"> | null>(null);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [deletingId, setDeletingId] = useState<Id<"designPersonas"> | null>(
    null,
  );

  const resetForm = () => {
    setEditingId(null);
    setCreating(false);
    setFormName("");
    setFormPrompt("");
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrompt.trim()) return;
    if (editingId) {
      await updatePersona({
        id: editingId,
        name: formName.trim(),
        prompt: formPrompt.trim(),
      });
    } else {
      await createPersona({
        repoId,
        name: formName.trim(),
        prompt: formPrompt.trim(),
      });
    }
    resetForm();
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await removePersona({ id: deletingId });
    if (selectedPersonaId === deletingId) {
      onClearPersona();
    }
    setDeletingId(null);
  };

  const handleStartEdit = (persona: NonNullable<typeof personas>[number]) => {
    setCreating(false);
    setEditingId(persona._id);
    setFormName(persona.name);
    setFormPrompt(persona.prompt);
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setCreating(true);
    setFormName("");
    setFormPrompt("");
  };

  const formUI = (
    <div className="space-y-2 rounded-md bg-muted/40 p-3">
      <Input
        placeholder="Persona name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
      />
      <Textarea
        placeholder="Describe this persona — their role, goals, context, preferences..."
        value={formPrompt}
        onChange={(e) => setFormPrompt(e.target.value)}
        rows={3}
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={resetForm}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          {editingId ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          className="motion-press text-primary hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => setOpen(true)}
        >
          <IconUsers size={14} />
          Personas
        </Button>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Personas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {personas?.map((persona) =>
              editingId === persona._id ? (
                <div key={persona._id}>{formUI}</div>
              ) : (
                <div
                  key={persona._id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {persona.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {persona.prompt}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleStartEdit(persona)}
                    >
                      <IconEdit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => setDeletingId(persona._id)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              ),
            )}
            {creating ? (
              formUI
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={handleStartCreate}
              >
                Add persona
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingId}
        onOpenChange={(v) => {
          if (!v) setDeletingId(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete persona</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this persona? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeletingId(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
