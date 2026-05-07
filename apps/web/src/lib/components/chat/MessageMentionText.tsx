import { useNavigate } from "@tanstack/react-router";
import { MentionText } from "@/lib/components/mentions";

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
              to: "/$owner/$repo/docs/$id",
              params: { owner, repo, id: match.id },
            })
          }
          className="bg-muted text-foreground rounded px-1 font-medium hover:bg-muted/80 transition-colors"
        >
          @{match.label}
        </button>
      )}
    />
  );
}
