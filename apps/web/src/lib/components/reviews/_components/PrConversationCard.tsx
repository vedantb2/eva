import { IconExternalLink } from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { MARKDOWN_CLASS, type PrComment } from "./prOverviewMeta";

/**
 * Issue comments and inline review comments as one chronological thread. Each
 * entry keeps its own header strip so the author and the file it points at read
 * separately from the comment body.
 */
export function PrConversationCard({
  comments,
  truncated,
}: {
  comments: PrComment[];
  truncated: boolean;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversation
          <span className="tabular-nums text-subtle-foreground">
            {comments.length}
          </span>
        </h2>
        {truncated ? (
          <span className="text-xs text-muted-foreground">
            Showing the latest page of comments
          </span>
        ) : null}
      </div>

      {comments.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground shadow-sm">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li
              key={`${comment.kind}-${comment.id}`}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                {comment.authorAvatarUrl ? (
                  <img
                    src={comment.authorAvatarUrl}
                    alt=""
                    className="size-5 rounded-full"
                  />
                ) : null}
                <span className="font-medium text-foreground">
                  {comment.authorLogin ?? "unknown"}
                </span>
                <span className="rounded border border-border bg-card px-1 py-0.5">
                  {comment.kind === "review" ? "review" : "comment"}
                </span>
                {comment.path ? (
                  <span className="min-w-0 truncate font-mono">
                    {comment.path}
                    {comment.line !== undefined && comment.line !== null
                      ? `:${comment.line}`
                      : ""}
                  </span>
                ) : null}
                <span className="ml-auto">
                  <RelativeDateTime
                    at={new Date(comment.createdAt).getTime()}
                  />
                </span>
                <a
                  href={comment.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  <IconExternalLink className="size-3" />
                </a>
              </div>
              <div className="p-3">
                <Streamdown className={MARKDOWN_CLASS}>
                  {comment.body}
                </Streamdown>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
