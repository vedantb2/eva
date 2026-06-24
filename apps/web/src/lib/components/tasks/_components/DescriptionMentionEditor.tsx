"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";
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
  DocMentionHoverCardBody,
  SkillMentionHoverCardBody,
  isSkillTokenId,
  isMentionTokenDocId,
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
  initialMentionMap?: Map<string, string>;
  initialSkillMap?: Map<string, string>;
  /** When true, blocks all input. Used while a draft is loading. */
  disabled?: boolean;
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
    initialMentionMap,
    initialSkillMap,
    disabled,
  },
  ref,
) {
  const { repo, basePath } = useRepo();
  const navigate = useNavigate();
  const docs = useQuery(api.docs.list, { repoId: repo._id }) ?? [];

  const handleMentionChipClick = useCallback(
    (id: string) => {
      navigate({
        to: `${basePath}/docs/${id}/${DOC_VIEWER_DEFAULT_TAB}`,
      });
    },
    [navigate, basePath],
  );

  const handleSkillChipClick = useCallback(
    (_skillId: string) => {
      navigate({ to: `${basePath}/settings/skills` });
    },
    [navigate, basePath],
  );
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
      onMentionChipClick={handleMentionChipClick}
      onSkillChipClick={handleSkillChipClick}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      disabled={disabled}
      renderMentionChipHoverCard={(id) =>
        isMentionTokenDocId(id) ? <DocMentionHoverCardBody docId={id} /> : null
      }
      renderSkillChipHoverCard={(id) =>
        isSkillTokenId(id) ? <SkillMentionHoverCardBody skillId={id} /> : null
      }
      placeholder={placeholder}
      ariaLabel={ariaLabel ?? placeholder ?? "Description"}
      className={cn(
        "rounded-control border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        minHeight,
        className,
      )}
      emptySlashContent={
        <span>
          No available skills.{" "}
          <DynamicLink
            to={`${basePath}/settings/skills`}
            className="text-foreground underline underline-offset-2"
          >
            Sync skills in Settings
          </DynamicLink>
        </span>
      }
      onBlur={onBlur}
    />
  );
});
