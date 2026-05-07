"use client";

import { forwardRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
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
}

interface UserMentionItem extends MentionItem<Id<"users">> {
  email: string | undefined;
}

export const CommentMentionInput = forwardRef<
  CommentMentionInputHandle,
  CommentMentionInputProps
>(function CommentMentionInput({ value, onValueChange, placeholder }, ref) {
  const { repo } = useRepo();
  const members = useQuery(
    api.teamMembers.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );

  const items: UserMentionItem[] = (members ?? []).flatMap((m) => {
    if (!m.user) return [];
    const label = m.user.fullName?.trim() || m.user.email?.trim();
    if (!label) return [];
    return [{ id: m.user._id, label, email: m.user.email }];
  });

  return (
    <MentionEditor<UserMentionItem>
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      items={items}
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Comment input"}
      className="min-h-16 max-h-40 overflow-y-auto rounded-md border border-input px-3 py-2 pr-12 focus-visible:ring-2 focus-visible:ring-ring"
      renderItem={(item) => (
        <div className="flex w-full items-baseline gap-2">
          <span className="truncate">@{item.label}</span>
          {item.email && item.email !== item.label && (
            <span className="truncate text-xs text-muted-foreground">
              {item.email}
            </span>
          )}
        </div>
      )}
    />
  );
});
