"use client";

import { useMutation } from "convex/react";
import { api, type Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { Button, Input, Textarea } from "@conductor/ui";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useCallback, useState } from "react";

type Skill = FunctionReturnType<typeof api.repoSkills.listByRepo>[number];

export function SkillRow({ skill }: { skill: Skill }) {
  const updateSkill = useMutation(api.repoSkills.update);
  const removeSkill = useMutation(api.repoSkills.remove);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(skill.title);
  const [prompt, setPrompt] = useState(skill.prompt);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !prompt.trim()) return;
    await updateSkill({
      id: skill._id,
      title: title.trim(),
      prompt: prompt.trim(),
    });
    setEditing(false);
  }, [title, prompt, updateSkill, skill._id]);

  const handleCancel = useCallback(() => {
    setTitle(skill.title);
    setPrompt(skill.prompt);
    setEditing(false);
  }, [skill.title, skill.prompt]);

  if (editing) {
    return (
      <div className="rounded-md bg-muted/40 p-3 space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 text-xs"
        />
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-24 text-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" className="h-8" onClick={handleSave}>
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{skill.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
          {skill.prompt}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconPencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => removeSkill({ id: skill._id })}
          className="p-1 text-muted-foreground transition-colors hover:text-destructive"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}
