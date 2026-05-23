"use client";

import { forwardRef, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Doc } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { cn } from "@conductor/ui";
import {
  MentionEditor,
  type MentionEditorHandle,
  type MentionItem,
  type SlashItem,
} from "@/lib/components/mentions";

export type DescriptionMentionEditorHandle = MentionEditorHandle;

function docDescriptionPreview(doc: {
  description?: string;
  content: string;
}): string | undefined {
  const description = doc.description?.trim();
  if (description) return description;
  const content = doc.content.trim();
  return content || undefined;
}

interface DescriptionMentionEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  ariaLabel?: string;
  onBlur?: () => void;
}

export const DescriptionMentionEditor = forwardRef<
  DescriptionMentionEditorHandle,
  DescriptionMentionEditorProps
>(function DescriptionMentionEditor(
  {
    value,
    onValueChange,
    placeholder,
    className,
    minHeight = "min-h-[120px]",
    ariaLabel,
    onBlur,
  },
  ref,
) {
  const { repo, basePath } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id }) ?? [];
  const skills =
    useQuery(api.repoSkills.listByRepo, { repoId: repo._id }) ?? [];

  const items: MentionItem<Doc<"docs">["_id"]>[] = useMemo(
    () =>
      docs.map((doc) => ({
        id: doc._id,
        label: doc.title,
        description: docDescriptionPreview(doc),
      })),
    [docs],
  );

  const slashItems: SlashItem[] = useMemo(
    () =>
      skills
        .filter((skill) => skill.available)
        .map((skill) => ({
          id: skill._id,
          label: skill.title,
          description: skill.description,
        })),
    [skills],
  );

  return (
    <MentionEditor
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      items={items}
      slashItems={slashItems}
      placeholder={placeholder}
      ariaLabel={ariaLabel ?? placeholder ?? "Description"}
      className={cn(
        "rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        minHeight,
        className,
      )}
      emptySlashContent={
        <span>
          No available skills.{" "}
          <Link
            to={`${basePath}/settings/skills`}
            className="text-foreground underline underline-offset-2"
          >
            Sync skills in Settings
          </Link>
        </span>
      }
      onBlur={onBlur}
    />
  );
});
