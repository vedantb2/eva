import { useNavigate } from "@tanstack/react-router";
import {
  MentionText,
  MENTION_CHIP_CLASS,
  SKILL_CHIP_CLASS,
} from "@/lib/components/mentions";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

interface MessageMentionTextProps {
  text: string;
  owner: string;
  repo: string;
  className?: string;
}

export function MessageMentionText({
  text,
  owner,
  repo,
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
          onClick={() =>
            navigate({
              to: "/$owner/$repo/docs/$id/$docTab",
              params: {
                owner,
                repo,
                id: match.id,
                docTab: DOC_VIEWER_DEFAULT_TAB,
              },
            })
          }
          className={`${MENTION_CHIP_CLASS} transition-[background-color] hover:bg-primary/20`}
        >
          @{match.label}
        </button>
      )}
      renderSkill={(match, key) => (
        <span key={key} className={SKILL_CHIP_CLASS}>
          /{match.label}
        </span>
      )}
    />
  );
}
