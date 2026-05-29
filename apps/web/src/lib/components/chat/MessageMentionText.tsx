import type { MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  MentionText,
  DocMentionChip,
  SkillMentionChip,
  isMentionTokenDocId,
  isSkillTokenId,
  MENTION_CHIP_CLASS,
  SKILL_CHIP_CLASS,
} from "@/lib/components/mentions";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

interface MessageMentionTextProps {
  text: string;
  /** Repo route prefix, e.g. `/owner/repo` or `/owner/repo--app`. */
  repoBasePath: string;
  className?: string;
}

export function MessageMentionText({
  text,
  repoBasePath,
  className,
}: MessageMentionTextProps) {
  const navigate = useNavigate();

  return (
    <MentionText
      text={text}
      className={className}
      renderMention={(match, key) => {
        const navigateToDoc = (e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          navigate({
            to: `${repoBasePath}/docs/${match.id}/${DOC_VIEWER_DEFAULT_TAB}`,
          });
        };
        if (isMentionTokenDocId(match.id)) {
          return (
            <DocMentionChip
              key={key}
              docId={match.id}
              label={match.label}
              onClick={navigateToDoc}
            />
          );
        }
        return (
          <button
            key={key}
            type="button"
            onClick={navigateToDoc}
            className={`${MENTION_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
          >
            @{match.label}
          </button>
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
