import { useNavigate } from "@tanstack/react-router";
import {
  MentionText,
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
      renderMention={(match, key) => (
        <button
          key={key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate({
              to: `${repoBasePath}/docs/${match.id}/${DOC_VIEWER_DEFAULT_TAB}`,
            });
          }}
          className={`${MENTION_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
        >
          @{match.label}
        </button>
      )}
      renderSkill={(match, key) => (
        <button
          key={key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: `${repoBasePath}/settings/skills` });
          }}
          className={`${SKILL_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
        >
          /{match.label}
        </button>
      )}
    />
  );
}
