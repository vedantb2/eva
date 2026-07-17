import { IconMessage } from "@tabler/icons-react";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { parseReviewCommentSegments } from "@/lib/reviewComments";

interface ReviewCommentMessageProps {
  text: string;
  repoBasePath: string;
}

function ReviewCommentCard({
  filePath,
  rangeLabel,
  text,
}: {
  filePath: string;
  rangeLabel: string;
  text: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="space-y-1">
        <div className="text-xs font-medium text-foreground">{filePath}</div>
        <div className="text-[11px] text-muted-foreground">{rangeLabel}</div>
      </div>
      {text.length > 0 ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function ReviewCommentMessage({
  text,
  repoBasePath,
}: ReviewCommentMessageProps) {
  const segments = parseReviewCommentSegments(text);
  const hasReviewComments = segments.some(
    (segment) => segment.kind === "review-comment",
  );

  if (!hasReviewComments) {
    return <MessageMentionText text={text} repoBasePath={repoBasePath} />;
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) =>
        segment.kind === "text" ? (
          segment.text.trim().length > 0 ? (
            <MessageMentionText
              key={segment.id}
              text={segment.text}
              repoBasePath={repoBasePath}
            />
          ) : null
        ) : (
          <div key={segment.comment.id} className="flex items-start gap-2">
            <IconMessage className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <ReviewCommentCard
              filePath={segment.comment.filePath}
              rangeLabel={segment.comment.rangeLabel}
              text={segment.comment.text}
            />
          </div>
        ),
      )}
    </div>
  );
}
