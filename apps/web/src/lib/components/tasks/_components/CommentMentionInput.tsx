"use client";

import { forwardRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials, UserProfileHoverCardBody } from "@conductor/shared";
import { cn } from "@conductor/ui";
import {
  MentionEditor,
  type MentionEditorHandle,
  type MentionItem,
  DataMentionHoverCardBody,
} from "@/lib/components/mentions";
import { useDataMentionItems } from "@/lib/hooks/useDataMentionItems";
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
  const members = useQuery(
    api.teamMembers.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );
  const dataItems = useDataMentionItems(repo._id);
  const navigateToData = useDataMentionNavigate(basePath, repo._id);

  const peopleItems: MentionItem<Id<"users">>[] = (members ?? []).flatMap(
    (m) => {
      if (!m.user) return [];
      const label = m.user.fullName?.trim() || m.user.email?.trim();
      if (!label) return [];
      return [{ id: m.user._id, label, badge: "Person" }];
    },
  );

  const peopleById = new Map<string, MentionItem<Id<"users">>>();
  for (const item of peopleItems) {
    peopleById.set(item.id, item);
  }

  const items: MentionItem[] = [...peopleItems, ...dataItems].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return (
    <MentionEditor
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      onEnterSubmit={onEnterSubmit}
      items={items}
      mentionPopupTitle="Mentions"
      onMentionChipClick={(id) => {
        if (peopleById.has(id)) return;
        void navigateToData(id);
      }}
      renderMentionChipHoverCard={(id) => {
        const person = peopleById.get(id);
        if (person) {
          return <UserProfileHoverCardBody userId={person.id} />;
        }
        return <DataMentionHoverCardBody entityId={id} repoId={repo._id} />;
      }}
      placeholder={placeholder}
      ariaLabel={placeholder ?? "Comment input"}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      disabled={disabled}
      className={cn(
        "min-h-9 max-h-40 overflow-y-auto rounded-control border border-input bg-card px-3 py-2 pr-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
      renderItem={(item) => {
        const person = peopleById.get(item.id);
        if (person) {
          return (
            <div className="flex w-full min-w-0 items-center gap-2">
              <UserInitials userId={person.id} size="sm" hideLastSeen />
              <span className="min-w-0 flex-1 truncate">{person.label}</span>
              <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                Person
              </span>
            </div>
          );
        }
        return (
          <span className="flex min-w-0 w-full flex-col gap-0.5 overflow-hidden">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                <span className="shrink-0 text-muted-foreground">@</span>
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge ? (
                <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                  {item.badge}
                </span>
              ) : null}
            </span>
            {item.description ? (
              <span className="truncate text-xs text-muted-foreground">
                {item.description}
              </span>
            ) : null}
          </span>
        );
      }}
    />
  );
});
