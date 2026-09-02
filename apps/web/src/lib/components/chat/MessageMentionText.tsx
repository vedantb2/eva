import type { MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  MentionText,
  SkillMentionChip,
  isSkillTokenId,
  isHarnessSkillTokenId,
  SKILL_CHIP_CLASS,
} from "@/lib/components/mentions";
import { AtMentionChip } from "@/lib/components/chat/MarkdownMentionText";
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
        // This renders the author's own draft/queued text, so a token may name
        // either a teammate or a data entity — AtMentionChip resolves which.
        return (
          <AtMentionChip
            key={key}
            id={match.id}
            label={match.label}
            repoId={repo._id}
            onNavigateToData={onClick}
          />
        );
      }}
      renderSkill={(match, key) => {
        const navigateToSkills = (e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          navigate({ to: `${repoBasePath}/settings/skills` });
        };
        if (isHarnessSkillTokenId(match.id)) {
          return (
            <span key={key} className={SKILL_CHIP_CLASS}>
              /{match.label}
            </span>
          );
        }
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
