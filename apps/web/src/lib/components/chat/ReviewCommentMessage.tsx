import { IconMessage } from "@tabler/icons-react";
import {
  MarkdownMentionText,
  MARKDOWN_PROSE_CLASS,
} from "@/lib/components/chat/MarkdownMentionText";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseReviewCommentSegments } from "@/lib/reviewComments";

interface ReviewCommentMessageProps {
  text: string;
  repoBasePath: string;
}

const BODY_CLASS = `${MARKDOWN_PROSE_CLASS} text-sm leading-relaxed break-words`;

function ReviewCommentCard({
  filePath,
  rangeLabel,
  text,
  repoBasePath,
}: {
  filePath: string;
  rangeLabel: string;
  text: string;
  repoBasePath: string;
}) {
  const { repo } = useRepo();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="space-y-1">
        <div className="text-xs font-medium text-foreground">{filePath}</div>
        <div className="text-[11px] text-muted-foreground">{rangeLabel}</div>
      </div>
      {text.length > 0 ? (
        <MarkdownMentionText
          text={text}
          repoBasePath={repoBasePath}
          repoId={repo._id}
          className={BODY_CLASS}
        />
      ) : null}
    </div>
  );
}

export function ReviewCommentMessage({
  text,
  repoBasePath,
}: ReviewCommentMessageProps) {
  const { repo } = useRepo();
  const segments = parseReviewCommentSegments(text);
  const hasReviewComments = segments.some(
    (segment) => segment.kind === "review-comment",
  );

  if (!hasReviewComments) {
    return (
      <MarkdownMentionText
        text={text}
        repoBasePath={repoBasePath}
        repoId={repo._id}
        className={BODY_CLASS}
      />
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) =>
        segment.kind === "text" ? (
          segment.text.trim().length > 0 ? (
            <MarkdownMentionText
              key={segment.id}
              text={segment.text}
              repoBasePath={repoBasePath}
              repoId={repo._id}
              className={BODY_CLASS}
            />
          ) : null
        ) : (
          <div key={segment.comment.id} className="flex items-start gap-2">
            <IconMessage className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <ReviewCommentCard
              filePath={segment.comment.filePath}
              rangeLabel={segment.comment.rangeLabel}
              text={segment.comment.text}
              repoBasePath={repoBasePath}
            />
          </div>
        ),
      )}
    </div>
  );
}
