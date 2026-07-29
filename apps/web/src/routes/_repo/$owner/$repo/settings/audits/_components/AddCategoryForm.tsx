"use client";

import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Button, Input, Textarea } from "@eva/ui";
import { IconPlus } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { useState } from "react";
import { SettingsField } from "@/lib/components/settings/SettingsField";

export function AddCategoryForm(props: {
  repoId: Id<"githubRepos">;
  appId?: Id<"githubRepos">;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCategory = useMutation(api.auditCategories.create);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) return;
    await createCategory({
      repoId: props.repoId,
      name: name.trim(),
      description: description.trim(),
      appId: props.appId,
    });
    setName("");
    setDescription("");
  };

  return (
    <div className="grid gap-4">
      <SettingsField label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Performance"
          className="h-8 text-xs"
        />
      </SettingsField>
      <SettingsField
        label="Description"
        description="This description is sent to the AI as instructions for what to audit."
      >
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this audit should check for..."
          className="min-h-[60px] resize-none text-xs"
        />
      </SettingsField>
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
