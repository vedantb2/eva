import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { useQueryState } from "nuqs";
import { docCommentFilterParser } from "@/lib/search-params";
import { Button, cn } from "@eva/ui";
import { IconX } from "@tabler/icons-react";
import { DocCommentThread } from "./DocCommentThread";
import { DocNewCommentComposer } from "./DocNewCommentComposer";

type DocComment = FunctionReturnType<typeof api.docComments.listByDoc>[number];

export function DocCommentsPanel({
  docId,
  allowAskEva = false,
  activeAnchorId,
  onAnchorClick,
  onClose,
  composingAnchorId,
  composingAnchorText,
  onCancelCompose,
  onCommentCreated,
  presentAnchorIds,
}: {
  docId: Id<"docs">;
  allowAskEva?: boolean;
  activeAnchorId: string | null;
  onAnchorClick: (anchorId: string) => void;
  onClose: () => void;
  composingAnchorId: string | null;
  composingAnchorText: string | null;
  onCancelCompose: () => void;
  onCommentCreated: () => void;
  presentAnchorIds: ReadonlySet<string>;
}) {
  const [filter, setFilter] = useQueryState("comments", docCommentFilterParser);
  // Kept nullable so the empty state can tell "loaded, none" from "still
  // loading" — collapsing straight to `[]` flashes the empty copy mid-fetch.
  const commentsResult = useQuery(api.docComments.listByDoc, { docId });
  const comments = commentsResult ?? [];

  const roots = comments.filter((c) => !c.parentId);
  const openRoots = roots.filter((c) => c.resolvedAt === undefined);
  const resolvedRoots = roots.filter((c) => c.resolvedAt !== undefined);
  const displayRoots = filter === "open" ? openRoots : resolvedRoots;

  const repliesByParent = new Map<string, DocComment[]>();
  for (const c of comments) {
    if (c.parentId) {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Comments</span>
          <span className="text-xs text-muted-foreground">
            {openRoots.length} open
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label="Close comments"
          onClick={onClose}
        >
          <IconX className="size-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
        <button
          type="button"
          onClick={() => setFilter("open")}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
            filter === "open"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Open ({openRoots.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("resolved")}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
            filter === "resolved"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Resolved ({resolvedRoots.length})
        </button>
      </div>

      <div className="scrollbar flex-1 overflow-y-auto">
        {composingAnchorId && (
          <div className="border-b border-border p-3">
            <DocNewCommentComposer
              docId={docId}
              anchorId={composingAnchorId}
              anchorText={composingAnchorText ?? ""}
              allowAskEva={allowAskEva}
              onCancel={onCancelCompose}
              onCreated={onCommentCreated}
            />
          </div>
        )}

        {commentsResult !== undefined &&
          displayRoots.length === 0 &&
          !composingAnchorId && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {filter === "open"
                ? "No open comments. Select text to comment."
                : "No resolved comments."}
            </p>
          )}

        {displayRoots.map((root) => (
          <DocCommentThread
            key={root._id}
            root={root}
            replies={repliesByParent.get(root._id) ?? []}
            docId={docId}
            isActive={root.anchorId === activeAnchorId}
            isOrphaned={!!root.anchorId && !presentAnchorIds.has(root.anchorId)}
            onClick={() => {
              if (root.anchorId) onAnchorClick(root.anchorId);
            }}
          />
        ))}
      </div>
    </div>
  );
}
