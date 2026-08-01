import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "@eva/backend";
import { UserInitials } from "@eva/shared";
import { Button, cn } from "@eva/ui";
import { IconX, IconCheck, IconArrowBackUp } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import {
  collectSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  acceptAllSuggestions,
  rejectAllSuggestions,
  revealSuggestion,
  type SuggestionInfo,
} from "@/lib/components/editor/suggestChanges";

const KIND_LABEL: Record<SuggestionInfo["kind"], string> = {
  insertion: "Insertion",
  deletion: "Deletion",
  modification: "Change",
};

const KIND_DOT: Record<SuggestionInfo["kind"], string> = {
  insertion: "bg-success",
  deletion: "bg-destructive",
  modification: "bg-warning",
};

export function DocSuggestionsPanel({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const suggestions = useEditorState({
    editor,
    selector: ({ editor: e }) => collectSuggestions(e.state.doc),
  });
  const list = suggestions ?? [];

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Suggestions</span>
          <span className="text-xs text-muted-foreground">{list.length}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label="Close suggestions"
          onClick={onClose}
        >
          <IconX className="size-3.5" />
        </Button>
      </div>

      {list.length > 0 && (
        <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={() => acceptAllSuggestions(editor)}
          >
            <IconCheck className="size-3" />
            Accept all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={() => rejectAllSuggestions(editor)}
          >
            <IconArrowBackUp className="size-3" />
            Reject all
          </Button>
        </div>
      )}

      <div className="scrollbar flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No suggestions yet. Switch to Suggesting mode and edit to propose
            changes.
          </p>
        ) : (
          list.map((s) => (
            <SuggestionRow key={s.id} editor={editor} suggestion={s} />
          ))
        )}
      </div>
    </div>
  );
}

function SuggestionRow({
  editor,
  suggestion,
}: {
  editor: Editor;
  suggestion: SuggestionInfo;
}) {
  const userId = toUserId(suggestion.userId);
  return (
    <div
      className="border-b border-border p-3 cursor-pointer transition-colors hover:bg-accent/40"
      onClick={() => revealSuggestion(editor, suggestion.id)}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            KIND_DOT[suggestion.kind],
          )}
        />
        {userId ? <UserInitials userId={userId} size="sm" /> : null}
        <SuggestionAuthorName userId={userId} />
        <span className="text-3xs text-muted-foreground">
          {KIND_LABEL[suggestion.kind]}
        </span>
        {suggestion.createdAt !== null && (
          <RelativeDateTime
            at={suggestion.createdAt}
            className="ml-auto text-3xs text-muted-foreground"
          />
        )}
      </div>

      {suggestion.text.trim().length > 0 && (
        <p
          className={cn(
            "mt-1 line-clamp-2 text-xs",
            suggestion.kind === "deletion"
              ? "text-destructive line-through"
              : "text-foreground",
          )}
        >
          {suggestion.text}
        </p>
      )}

      <div
        className="mt-2 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-1.5 text-xs"
          onClick={() => acceptSuggestion(editor, suggestion.id)}
        >
          <IconCheck className="size-3" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-1.5 text-xs"
          onClick={() => rejectSuggestion(editor, suggestion.id)}
        >
          <IconArrowBackUp className="size-3" />
          Reject
        </Button>
      </div>
    </div>
  );
}

type UserProfile = FunctionReturnType<typeof api.users.get>;

function SuggestionAuthorName({ userId }: { userId: Id<"users"> | null }) {
  const user = useQuery(api.users.get, userId ? { id: userId } : "skip");
  return (
    <span data-pii className="truncate text-xs font-medium">
      {authorName(userId, user)}
    </span>
  );
}

function authorName(
  userId: Id<"users"> | null,
  user: UserProfile | undefined,
): string {
  if (!userId) return "Someone";
  if (user === undefined) return "…";
  if (user === null) return "Unknown";
  if (user.fullName?.trim()) return user.fullName.trim();
  const parts = [user.firstName, user.lastName].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  if (parts.length > 0) return parts.join(" ");
  if (user.email?.trim()) return user.email.trim();
  return "Unknown";
}

/** Matches a Convex users-table id (mirrors the guard in user-initials.tsx). */
const USER_ID_PATTERN = /^[a-z0-9_]{16,40}$/;

function isUserId(id: string): id is Id<"users"> {
  return USER_ID_PATTERN.test(id);
}

/** Narrows a suggestion id's author segment to a real users-table id. */
function toUserId(userId: string | null): Id<"users"> | null {
  return userId && isUserId(userId) ? userId : null;
}
