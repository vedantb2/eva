import { Fragment, type ReactNode } from "react";
import { MENTION_TOKEN_REGEX } from "./mentionToken";

export interface MentionMatch {
  label: string;
  id: string;
}

interface MentionTextProps {
  text: string;
  className?: string;
  /** How to render each `@[label](id)` token. Defaults to a styled chip. */
  renderMention?: (match: MentionMatch, key: number) => ReactNode;
}

interface PlainSegment {
  kind: "text";
  value: string;
}

interface MentionSegmentMatch {
  kind: "mention";
  match: MentionMatch;
}

type Segment = PlainSegment | MentionSegmentMatch;

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  const regex = new RegExp(MENTION_TOKEN_REGEX);

  for (const m of text.matchAll(regex)) {
    const start = m.index;
    if (start === undefined) continue;
    if (start > cursor) {
      segments.push({ kind: "text", value: text.slice(cursor, start) });
    }
    segments.push({ kind: "mention", match: { label: m[1], id: m[2] } });
    cursor = start + m[0].length;
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }
  return segments;
}

const defaultRenderMention = (match: MentionMatch, key: number): ReactNode => (
  <span key={key} className="rounded bg-muted px-1 font-medium text-foreground">
    @{match.label}
  </span>
);

export function MentionText({
  text,
  className,
  renderMention = defaultRenderMention,
}: MentionTextProps) {
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
        return renderMention(segment.match, i);
      })}
    </p>
  );
}
