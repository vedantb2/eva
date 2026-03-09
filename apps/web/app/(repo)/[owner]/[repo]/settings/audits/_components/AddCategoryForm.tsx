"use client";

import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { Button, Input, Textarea } from "@conductor/ui";
import { IconPlus } from "@tabler/icons-react";
import type { Id } from "@conductor/backend/convex/_generated/dataModel";
import { useCallback, useState } from "react";

export function AddCategoryForm(props: { repoId: Id<"githubRepos"> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCategory = useMutation(api.auditCategories.create);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !description.trim()) return;
    await createCategory({
      repoId: props.repoId,
      name: name.trim(),
      description: description.trim(),
    });
    setName("");
    setDescription("");
  }, [name, description, createCategory, props.repoId]);

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Performance"
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this audit should check for..."
          className="text-xs min-h-[60px] resize-none"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          This description is sent to the AI as instructions for what to audit.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSubmit}
        disabled={!name.trim() || !description.trim()}
        className="w-fit"
      >
        <IconPlus size={14} />
        Add Category
      </Button>
    </div>
  );
}
