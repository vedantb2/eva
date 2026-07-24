"use client";

import { forwardRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { cn } from "@conductor/ui";
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

export type DescriptionMentionEditorHandle = MentionEditorHandle;

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
  const items = useDataMentionItems(repo._id);
  const navigateToData = useDataMentionNavigate(basePath, repo._id);

  const handleMentionChipClick = (id: string) => {
    void navigateToData(id);
  };

  const handleSkillChipClick = (_skillId: string) => {
    navigate({ to: `${basePath}/settings/skills` });
  };
  const skills =
    useQuery(api.repoSkills.listByRepo, { repoId: repo._id }) ?? [];

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
      onValueChange={onValueChange}
      items={items}
      slashItems={slashItems}
      mentionPopupTitle="Data"
      onMentionChipClick={handleMentionChipClick}
      onSkillChipClick={handleSkillChipClick}
      initialMentionMap={initialMentionMap}
      initialSkillMap={initialSkillMap}
      disabled={disabled}
      renderMentionChipHoverCard={(id) => (
        <DataMentionHoverCardBody entityId={id} repoId={repo._id} />
      )}
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
