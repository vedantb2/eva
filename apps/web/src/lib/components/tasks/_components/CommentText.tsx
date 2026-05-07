import { Fragment } from "react";
import { MENTION_TOKEN_REGEX } from "@/lib/components/chat/mentionToken";

interface CommentTextProps {
  text: string;
  className?: string;
}

interface PlainSegment {
  kind: "text";
  value: string;
}

interface MentionSegment {
  kind: "mention";
  label: string;
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
    segments.push({ kind: "mention", label: match[1] });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }
  return segments;
}

export function CommentText({ text, className }: CommentTextProps) {
  const segments = parseSegments(text);

  return (
    <p
      className={
        className ?? "text-sm text-foreground whitespace-pre-wrap break-words"
      }
    >
      {segments.map((segment, i) => {
        if (segment.kind === "text") {
          return <Fragment key={i}>{segment.value}</Fragment>;
        }
        return (
          <span
            key={i}
            className="rounded bg-muted px-1 font-medium text-foreground"
          >
            @{segment.label}
          </span>
        );
      })}
    </p>
  );
}
