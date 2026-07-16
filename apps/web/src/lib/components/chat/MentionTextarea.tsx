"use client";

import { forwardRef, useCallback, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { usePromptInputController } from "@conductor/ui";
import type { Doc, Id } from "@conductor/backend";
import {
  MentionEditor,
  type MentionEditorHandle,
  type MentionItem,
  type SlashItem,
  DocMentionHoverCardBody,
  SkillMentionHoverCardBody,
  isSkillTokenId,
  isMentionTokenDocId,
} from "@/lib/components/mentions";
import { useDocMentionNavigate } from "@/lib/useDocMentionNavigate";

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
  initialMentionMap?: Map<string, string>;
  initialSkillMap?: Map<string, string>;
  /**
   * Previously sent messages as editable display text, newest-first. When
   * provided, ArrowUp on the first line recalls older messages and ArrowDown
   * moves back toward the live draft (terminal-style history).
   */
  history?: string[];
}

export const MentionTextarea = forwardRef<
  MentionTextareaHandle,
  MentionTextareaProps
>(function MentionTextarea(
  {
    repoBasePath,
    docs,
    skills = [],
    skillsSettingsHref,
    placeholder,
    initialMentionMap,
    initialSkillMap,
    history,
  },
  ref,
) {
  const navigate = useNavigate();
  const controller = usePromptInputController();
  const value = controller.textInput.value;
  const navigateToDocById = useDocMentionNavigate(repoBasePath);

  // Cursor into `history` (null = editing the live draft) and the draft stashed
  // when history navigation began, so ArrowDown past the newest entry restores it.
  const historyIndexRef = useRef<number | null>(null);
  const stashedDraftRef = useRef("");
  const setInput = controller.textInput.setInput;

  // Any manual keystroke exits history navigation back to a fresh draft.
  const handleValueChange = useCallback(
    (next: string) => {
      historyIndexRef.current = null;
      setInput(next);
    },
    [setInput],
  );

  const handleHistoryNavigate = useCallback(
    (direction: "up" | "down") => {
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
    },
    [history, value, setInput],
  );

  const handleMentionChipClick = useCallback(
    (id: string) => {
      if (isMentionTokenDocId(id)) {
        void navigateToDocById(id, docs);
      }
    },
    [docs, navigateToDocById],
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
      onValueChange={handleValueChange}
      onHistoryNavigate={
        history && history.length > 0 ? handleHistoryNavigate : undefined
      }
      items={items}
      slashItems={slashItems}
      onMentionChipClick={handleMentionChipClick}
      onSkillChipClick={handleSkillChipClick}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      renderMentionChipHoverCard={(id) =>
        isMentionTokenDocId(id) ? <DocMentionHoverCardBody docId={id} /> : null
      }
      renderSkillChipHoverCard={(id) =>
        isSkillTokenId(id) ? <SkillMentionHoverCardBody skillId={id} /> : null
      }
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
