"use client";

import { forwardRef, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  usePromptInputController,
  usePromptInputAttachments,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import {
  MentionEditor,
  type MentionEditorHandle,
  type SlashItem,
  DataMentionHoverCardBody,
  SkillMentionHoverCardBody,
  isSkillTokenId,
} from "@/lib/components/mentions";
import { useDataMentionItems } from "@/lib/hooks/useDataMentionItems";
import { useDataMentionNavigate } from "@/lib/useDataMentionNavigate";

export type MentionTextareaHandle = MentionEditorHandle;

interface MentionTextareaProps {
  /** Repo route prefix, e.g. `/owner/repo` or `/owner/repo--app`. */
  repoBasePath: string;
  repoId: Id<"githubRepos">;
  skills?: Array<{
    _id: Id<"repoSkills">;
    title: string;
    description: string;
    available: boolean;
  }>;
  skillsSettingsHref?: string;
  placeholder?: string;
  initialMentionMap?: Map<string, string>;
  initialSkillMap?: Map<string, string>;
  /**
   * Previously sent messages as editable display text, newest-first. When
   * provided, ArrowUp on the first line recalls older messages and ArrowDown
   * moves back toward the live draft (terminal-style history).
   */
  history?: string[];
  /**
   * When true, pasted images are added as attachments (via the prompt-input
   * attachment context) instead of being inserted as text. Opt-in so surfaces
   * that don't send attachments (e.g. design chat) keep plain-text paste.
   */
  enableImagePaste?: boolean;
}

export const MentionTextarea = forwardRef<
  MentionTextareaHandle,
  MentionTextareaProps
>(function MentionTextarea(
  {
    repoBasePath,
    repoId,
    skills = [],
    skillsSettingsHref,
    placeholder,
    initialMentionMap,
    initialSkillMap,
    history,
    enableImagePaste,
  },
  ref,
) {
  const navigate = useNavigate();
  const controller = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const value = controller.textInput.value;
  const items = useDataMentionItems(repoId);
  const navigateToData = useDataMentionNavigate(repoBasePath, repoId);

  // Cursor into `history` (null = editing the live draft) and the draft stashed
  // when history navigation began, so ArrowDown past the newest entry restores it.
  const historyIndexRef = useRef<number | null>(null);
  const stashedDraftRef = useRef("");
  const setInput = controller.textInput.setInput;

  // Any manual keystroke exits history navigation back to a fresh draft.
  const handleValueChange = (next: string) => {
    historyIndexRef.current = null;
    setInput(next);
  };

  const handleHistoryNavigate = (direction: "up" | "down") => {
    if (!history || history.length === 0) return false;
    if (direction === "up") {
      if (historyIndexRef.current === null) {
        stashedDraftRef.current = value;
        historyIndexRef.current = 0;
      } else {
        historyIndexRef.current = Math.min(
          historyIndexRef.current + 1,
          history.length - 1,
        );
      }
      setInput(history[historyIndexRef.current] ?? "");
      return true;
    }
    if (historyIndexRef.current === null) return false;
    if (historyIndexRef.current === 0) {
      historyIndexRef.current = null;
      setInput(stashedDraftRef.current);
      return true;
    }
    historyIndexRef.current -= 1;
    setInput(history[historyIndexRef.current] ?? "");
    return true;
  };

  const handleMentionChipClick = (id: string) => {
    void navigateToData(id);
  };

  const handleSkillChipClick = (_skillId: string) => {
    navigate({ to: `${repoBasePath}/settings/skills` });
  };

  const slashItems: SlashItem[] = skills.flatMap((skill) =>
    skill.available
      ? [
          {
            id: skill._id,
            label: skill.title,
            description: skill.description,
          },
        ]
      : [],
  );

  return (
    <MentionEditor
      ref={ref}
      value={value}
      onValueChange={handleValueChange}
      onHistoryNavigate={
        history && history.length > 0 ? handleHistoryNavigate : undefined
      }
      items={items}
      slashItems={slashItems}
      mentionPopupTitle="Data"
      onMentionChipClick={handleMentionChipClick}
      onSkillChipClick={handleSkillChipClick}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      renderMentionChipHoverCard={(id) => (
        <DataMentionHoverCardBody entityId={id} repoId={repoId} />
      )}
      renderSkillChipHoverCard={(id) =>
        isSkillTokenId(id) ? <SkillMentionHoverCardBody skillId={id} /> : null
      }
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Message input"}
      onImageFiles={enableImagePaste ? attachments.add : undefined}
      dataSlot="input-group-control"
      className="min-h-9 max-h-40 self-stretch overflow-y-auto rounded-none px-3.5 py-3 text-left focus-visible:outline-none"
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
