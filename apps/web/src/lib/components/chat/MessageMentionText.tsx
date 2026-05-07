import { Fragment } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MENTION_TOKEN_REGEX } from "./mentionToken";

interface MessageMentionTextProps {
  text: string;
  owner: string;
  repo: string;
  className?: string;
}

interface PlainSegment {
  kind: "text";
  value: string;
}

interface MentionSegment {
  kind: "mention";
  title: string;
  docId: string;
}

type Segment = PlainSegment | MentionSegment;

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  const regex = new RegExp(MENTION_TOKEN_REGEX);

  for (const match of text.matchAll(regex)) {
    const start = match.index;
    if (start === undefined) continue;
    if (start > cursor) {
      segments.push({ kind: "text", value: text.slice(cursor, start) });
    }
    segments.push({ kind: "mention", title: match[1], docId: match[2] });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }
  return segments;
}

export function MessageMentionText({
  text,
  owner,
  repo,
  className,
}: MessageMentionTextProps) {
  const navigate = useNavigate();
  const segments = parseSegments(text);

  return (
    <p className={className ?? "text-sm whitespace-pre-wrap break-words"}>
      {segments.map((segment, i) => {
        if (segment.kind === "text") {
          return <Fragment key={i}>{segment.value}</Fragment>;
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() =>
              navigate({
                to: "/$owner/$repo/docs/$id",
                params: { owner, repo, id: segment.docId },
              })
            }
            className="bg-muted text-foreground rounded px-1 font-medium hover:bg-muted/80 transition-colors"
          >
            @{segment.title}
          </button>
        );
      })}
    </p>
  );
}
