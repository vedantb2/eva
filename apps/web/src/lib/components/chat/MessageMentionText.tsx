import { useNavigate } from "@tanstack/react-router";
import { MentionText } from "@/lib/components/mentions";
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
          className="rounded bg-muted px-1 font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          @{match.label}
        </button>
      )}
      renderSkill={(match, key) => (
        <span
          key={key}
          className="rounded-md bg-muted/60 px-1 font-medium text-foreground"
        >
          /{match.label}
        </span>
      )}
    />
  );
}
