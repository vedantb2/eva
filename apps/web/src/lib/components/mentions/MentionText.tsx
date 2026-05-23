import { Fragment, type ReactNode } from "react";
import { MENTION_CHIP_CLASS, SKILL_CHIP_CLASS } from "./mentionChipStyles";
import { MENTION_TOKEN_REGEX } from "./mentionToken";
import { SKILL_TOKEN_REGEX } from "./skillToken";

export interface MentionMatch {
  label: string;
  id: string;
}

export interface SkillMatch {
  label: string;
  id: string;
}

interface MentionTextProps {
  text: string;
  className?: string;
  renderMention?: (match: MentionMatch, key: number) => ReactNode;
  renderSkill?: (match: SkillMatch, key: number) => ReactNode;
}

interface PlainSegment {
  kind: "text";
  value: string;
}

interface MentionSegmentMatch {
  kind: "mention";
  match: MentionMatch;
}

interface SkillSegmentMatch {
  kind: "skill";
  match: SkillMatch;
}

type Segment = PlainSegment | MentionSegmentMatch | SkillSegmentMatch;

function parseSegments(text: string): Segment[] {
  const combined = new RegExp(
    `${MENTION_TOKEN_REGEX.source}|${SKILL_TOKEN_REGEX.source}`,
    "g",
  );

  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(combined)) {
    const start = match.index;
    if (start === undefined) continue;
    if (start > cursor) {
      segments.push({ kind: "text", value: text.slice(cursor, start) });
    }

    if (match[0].startsWith("@")) {
      segments.push({
        kind: "mention",
        match: { label: match[1], id: match[2] },
      });
    } else {
      segments.push({
        kind: "skill",
        match: { label: match[3], id: match[4] },
      });
    }

    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }

  return segments;
}

const defaultRenderMention = (match: MentionMatch, key: number): ReactNode => (
  <span key={key} className={MENTION_CHIP_CLASS}>
    @{match.label}
  </span>
);

const defaultRenderSkill = (match: SkillMatch, key: number): ReactNode => (
  <span key={key} className={SKILL_CHIP_CLASS}>
    /{match.label}
  </span>
);

export function MentionText({
  text,
  className,
  renderMention = defaultRenderMention,
  renderSkill = defaultRenderSkill,
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
        if (segment.kind === "mention") {
          return renderMention(segment.match, i);
        }
        return renderSkill(segment.match, i);
      })}
    </p>
  );
}
