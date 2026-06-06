"use client";

import { forwardRef, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";
import { usePromptInputController } from "@conductor/ui";
import type { Doc, Id } from "@conductor/backend";
import {
  MentionEditor,
  type MentionEditorHandle,
  type MentionItem,
  type SlashItem,
} from "@/lib/components/mentions";

export type MentionTextareaHandle = MentionEditorHandle;

function docDescriptionPreview(doc: {
  description?: string;
  content: string;
}): string | undefined {
  const description = doc.description?.trim();
  if (description) return description;
  const content = doc.content.trim();
  return content || undefined;
}

interface MentionTextareaProps {
  /** Repo route prefix, e.g. `/owner/repo` or `/owner/repo--app`. */
  repoBasePath: string;
  docs: Array<Doc<"docs">>;
  skills?: Array<{
    _id: Id<"repoSkills">;
    title: string;
    description: string;
    available: boolean;
  }>;
  skillsSettingsHref?: string;
  placeholder?: string;
}

export const MentionTextarea = forwardRef<
  MentionTextareaHandle,
  MentionTextareaProps
>(function MentionTextarea(
  { repoBasePath, docs, skills = [], skillsSettingsHref, placeholder },
  ref,
) {
  const navigate = useNavigate();
  const controller = usePromptInputController();
  const value = controller.textInput.value;

  const handleMentionChipClick = useCallback(
    (id: Doc<"docs">["_id"]) => {
      navigate({
        to: `${repoBasePath}/docs/${id}/${DOC_VIEWER_DEFAULT_TAB}`,
      });
    },
    [navigate, repoBasePath],
  );

  const handleSkillChipClick = useCallback(
    (_skillId: string) => {
      navigate({ to: `${repoBasePath}/settings/skills` });
    },
    [navigate, repoBasePath],
  );

  const items: MentionItem<Doc<"docs">["_id"]>[] = docs.map((doc) => ({
    id: doc._id,
    label: doc.title,
    description: docDescriptionPreview(doc),
  }));

  const slashItems: SlashItem[] = skills
    .filter((skill) => skill.available)
    .map((skill) => ({
      id: skill._id,
      label: skill.title,
      description: skill.description,
    }));

  return (
    <MentionEditor
      ref={ref}
      value={value}
      onValueChange={controller.textInput.setInput}
      items={items}
      slashItems={slashItems}
      onMentionChipClick={handleMentionChipClick}
      onSkillChipClick={handleSkillChipClick}
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Message input"}
      dataSlot="input-group-control"
      className="min-h-16 max-h-40 self-stretch overflow-y-auto rounded-none px-3.5 py-3 text-left focus-visible:outline-none"
      emptySlashContent={
        skillsSettingsHref ? (
          <span>
            No available skills.{" "}
            <Link
              to={skillsSettingsHref}
              className="text-foreground underline underline-offset-2"
            >
              Sync skills in Settings
            </Link>
          </span>
        ) : (
          "No available skills."
        )
      }
      onEnterSubmit={(e) => {
        const form = e.currentTarget.closest("form");
        if (!(form instanceof HTMLFormElement)) return;
        const submitButton = form.querySelector('button[type="submit"]');
        if (
          submitButton instanceof HTMLButtonElement &&
          submitButton.disabled
        ) {
          return;
        }
        form.requestSubmit();
      }}
    />
  );
});
