"use client";

import { useMutation } from "convex/react";
import { api, type Id } from "@conductor/backend";
import { Button, Input, Textarea } from "@conductor/ui";
import { IconPlus } from "@tabler/icons-react";
import { useCallback, useState } from "react";

export function AddSkillForm(props: { repoId: Id<"githubRepos"> }) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const createSkill = useMutation(api.repoSkills.create);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !prompt.trim()) return;
    await createSkill({
      repoId: props.repoId,
      title: title.trim(),
      prompt: prompt.trim(),
    });
    setTitle("");
    setPrompt("");
  }, [title, prompt, createSkill, props.repoId]);

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Title
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Code Review"
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Prompt
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Instructions injected when this skill is used in chat..."
          className="min-h-24 text-xs"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-fit"
        onClick={handleSubmit}
        disabled={!title.trim() || !prompt.trim()}
      >
        <IconPlus size={14} />
        Add Skill
      </Button>
    </div>
  );
}
