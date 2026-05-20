"use client";

import { forwardRef } from "react";
import { Link } from "@tanstack/react-router";
import { usePromptInputController } from "@conductor/ui";
import type { Doc, Id } from "@conductor/backend";
import {
  MentionEditor,
  type MentionEditorHandle,
  type MentionItem,
} from "@/lib/components/mentions";

export type MentionTextareaHandle = MentionEditorHandle;

interface MentionTextareaProps {
  docs: Array<Doc<"docs">>;
  skills?: Array<{ _id: Id<"repoSkills">; title: string }>;
  skillsSettingsHref?: string;
  placeholder?: string;
}

export const MentionTextarea = forwardRef<
  MentionTextareaHandle,
  MentionTextareaProps
>(function MentionTextarea(
  { docs, skills = [], skillsSettingsHref, placeholder },
  ref,
) {
  const controller = usePromptInputController();
  const value = controller.textInput.value;

  const items: MentionItem<Doc<"docs">["_id"]>[] = docs.map((d) => ({
    id: d._id,
    label: d.title,
  }));

  const slashItems: MentionItem[] = skills.map((skill) => ({
    id: skill._id,
    label: skill.title,
  }));

  return (
    <MentionEditor
      ref={ref}
      value={value}
      onValueChange={controller.textInput.setInput}
      items={items}
      slashItems={slashItems}
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Message input"}
      dataSlot="input-group-control"
      chipClassName="rounded-md bg-muted/60 px-1 font-bold"
      skillChipClassName="rounded-md bg-muted/60 px-1 font-bold"
      className="min-h-16 max-h-40 self-stretch overflow-y-auto px-3.5 py-3 text-left focus-visible:outline-none"
      emptySlashContent={
        skillsSettingsHref ? (
          <span>
            No skills configured.{" "}
            <Link
              to={skillsSettingsHref}
              className="text-foreground underline underline-offset-2"
            >
              Add skills in Settings
            </Link>
          </span>
        ) : (
          "No skills configured."
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
