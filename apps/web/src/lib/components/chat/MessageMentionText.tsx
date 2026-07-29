import type { MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  MentionText,
  DataMentionChip,
  SkillMentionChip,
  isSkillTokenId,
  SKILL_CHIP_CLASS,
} from "@/lib/components/mentions";
import { useDataMentionNavigate } from "@/lib/useDataMentionNavigate";
import { useRepo } from "@/lib/contexts/RepoContext";

interface MessageMentionTextProps {
  text: string;
  /** Repo route prefix, e.g. `/owner/repo` or `/owner/repo--app`. */
  repoBasePath: string;
  className?: string;
  /** Root element — `"span"` for inline single-line contexts (see MentionText). */
  as?: "p" | "span";
}

export function MessageMentionText({
  text,
  repoBasePath,
  className,
  as,
}: MessageMentionTextProps) {
  const navigate = useNavigate();
  const { repo } = useRepo();
  const navigateToData = useDataMentionNavigate(repoBasePath, repo._id);

  return (
    <MentionText
      text={text}
      className={className}
      as={as}
      renderMention={(match, key) => {
        const onClick = (e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          void navigateToData(match.id);
        };
        return (
          <DataMentionChip
            key={key}
            entityId={match.id}
            repoId={repo._id}
            label={match.label}
            onClick={onClick}
          />
        );
      }}
      renderSkill={(match, key) => {
        const navigateToSkills = (e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          navigate({ to: `${repoBasePath}/settings/skills` });
        };
        if (isSkillTokenId(match.id)) {
          return (
            <SkillMentionChip
              key={key}
              skillId={match.id}
              label={match.label}
              onClick={navigateToSkills}
            />
          );
        }
        return (
          <button
            key={key}
            type="button"
            onClick={navigateToSkills}
            className={`${SKILL_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
          >
            /{match.label}
          </button>
        );
      }}
    />
  );
}
