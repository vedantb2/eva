"use client";

import { forwardRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@conductor/shared";
import { cn } from "@conductor/ui";
import {
  MentionEditor,
  type MentionEditorHandle,
  type MentionItem,
} from "@/lib/components/mentions";

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

type UserMentionItem = MentionItem<Id<"users">>;

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
  const { repo } = useRepo();
  const members = useQuery(
    api.teamMembers.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );

  const items: UserMentionItem[] = (members ?? []).flatMap((m) => {
    if (!m.user) return [];
    const label = m.user.fullName?.trim() || m.user.email?.trim();
    if (!label) return [];
    return [{ id: m.user._id, label }];
  });

  return (
    <MentionEditor<UserMentionItem>
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      onEnterSubmit={onEnterSubmit}
      items={items}
      mentionPopupTitle="People"
      mentionChipHoverCard
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Comment input"}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      disabled={disabled}
      className={cn(
        "min-h-16 max-h-40 overflow-y-auto rounded-control border border-input bg-card px-3 py-2 pr-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
      renderItem={(item) => (
        <div className="flex w-full min-w-0 items-center gap-2">
          <UserInitials userId={item.id} size="sm" hideLastSeen />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
        </div>
      )}
    />
  );
});
