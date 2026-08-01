"use client";

import { forwardRef } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserProfileHoverCardBody } from "@eva/shared";
import { cn } from "@eva/ui";
import {
  MentionEditor,
  type MentionEditorHandle,
  DataMentionHoverCardBody,
  mergeMentionItems,
} from "@/lib/components/mentions";
import { useDataMentionItems } from "@/lib/hooks/useDataMentionItems";
import { usePeopleMentionItems } from "@/lib/hooks/usePeopleMentionItems";
import { useDataMentionNavigate } from "@/lib/useDataMentionNavigate";

export type CommentMentionInputHandle = MentionEditorHandle;

interface CommentMentionInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Submit on Enter (Shift+Enter inserts a newline). */
  onEnterSubmit?: () => void;
  initialMentionMap?: Map<string, string>;
  initialSkillMap?: Map<string, string>;
  /** When true, blocks all input. Used while a draft is loading. */
  disabled?: boolean;
}

export const CommentMentionInput = forwardRef<
  CommentMentionInputHandle,
  CommentMentionInputProps
>(function CommentMentionInput(
  {
    value,
    onValueChange,
    placeholder,
    className,
    onEnterSubmit,
    initialMentionMap,
    initialSkillMap,
    disabled,
  },
  ref,
) {
  const { repo, basePath } = useRepo();
  const peopleItems = usePeopleMentionItems(repo._id);
  const dataItems = useDataMentionItems(repo._id);
  const navigateToData = useDataMentionNavigate(basePath, repo._id);
  const { items, peopleIds } = mergeMentionItems(peopleItems, dataItems);

  return (
    <MentionEditor
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      onEnterSubmit={onEnterSubmit}
      items={items}
      mentionPopupTitle="Mentions"
      onMentionChipClick={(id) => {
        if (peopleIds.has(id)) return;
        void navigateToData(id);
      }}
      renderMentionChipHoverCard={(id) =>
        peopleIds.has(id) ? (
          <UserProfileHoverCardBody userId={id} />
        ) : (
          <DataMentionHoverCardBody entityId={id} repoId={repo._id} />
        )
      }
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Comment input"}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      disabled={disabled}
      className={cn(
        "min-h-9 max-h-40 overflow-y-auto scrollbar rounded-control border border-input bg-card px-3 py-2 pr-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
    />
  );
});
