"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import type { Transaction } from "@tiptap/pm/state";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { docModeParser, type DocMode } from "@/lib/search-params";
import { nanoid } from "nanoid";
import { Button, Spinner, Textarea } from "@conductor/ui";
import { IconMessage } from "@tabler/icons-react";
import { FloatingToc } from "../FloatingToc";
import { DocCommentsPanel } from "./DocCommentsPanel";
import { DocHistoryPanel } from "./DocHistoryPanel";
import { DocSuggestionsPanel } from "./DocSuggestionsPanel";
import { DocVersionDiff } from "./DocVersionDiff";
import {
  SuggestChangesKit,
  enableSuggesting,
  disableSuggesting,
  collectSuggestions,
  setContentUntracked,
} from "@/lib/components/editor/suggestChanges";
import {
  DocCommentMark,
  DocCommentHighlight,
  applyCommentAnchor,
  removeCommentAnchor,
  collectPresentAnchorIds,
  setCommentHighlightState,
  scrollToAnchor,
} from "../_utils/docCommentAnchors";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

const baseEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  Markdown.configure({
    markedOptions: { gfm: true },
  }),
];

export function DocContentTab({
  doc,
  commentsOpen,
  onToggleComments,
  historyOpen,
  onToggleHistory,
  suggestionsOpen,
  onToggleSuggestions,
  onSuggestionCount,
}: {
  doc: Doc;
  commentsOpen: boolean;
  onToggleComments: () => void;
  historyOpen: boolean;
  onToggleHistory: () => void;
  suggestionsOpen: boolean;
  onToggleSuggestions: () => void;
  onSuggestionCount: (count: number) => void;
}) {
  const [mode] = useQueryState("mode", docModeParser);
  const ensureSyncDoc = useMutation(api.docs.ensureSyncDoc);
  const updateDoc = useMutation(api.docs.update);
  const touchDraft = useMutation(api.docVersions.touchDraft);
  const saveVersion = useMutation(api.docVersions.saveVersion);

  // Attribute new suggestions to the current user; a stable ref avoids
  // recreating the editor when auth resolves.
  const currentUserId = useQuery(api.auth.me);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = currentUserId ?? null;
  // Clicking a highlight routes here; the ref lets the (memoized once) editor
  // extension reach the latest handler without recreating the editor.
  const anchorClickRef = useRef<(anchorId: string) => void>(() => undefined);
  const extensions = useMemo(
    () => [
      ...baseEditorExtensions,
      SuggestChangesKit.configure({ getUserId: () => userIdRef.current }),
      DocCommentMark,
      DocCommentHighlight.configure({
        onAnchorClick: (anchorId) => anchorClickRef.current(anchorId),
      }),
    ],
    [],
  );

  const sync = useTiptapSync(api.prosemirrorSync, doc._id);

  const [composingAnchorId, setComposingAnchorId] = useState<string | null>(
    null,
  );
  const [composingAnchorText, setComposingAnchorText] = useState<string | null>(
    null,
  );
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [presentAnchorIds, setPresentAnchorIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // Cached query (shared with the panel). Open anchors = unresolved thread
  // roots plus the anchor currently being composed.
  const comments =
    useQuery(api.docComments.listByDoc, { docId: doc._id }) ?? [];
  const openAnchorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of comments) {
      if (!c.parentId && c.resolvedAt === undefined && c.anchorId) {
        ids.add(c.anchorId);
      }
    }
    if (composingAnchorId) ids.add(composingAnchorId);
    return ids;
  }, [comments, composingAnchorId]);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const lastTouchDraftRef = useRef<number>(0);
  const editCountRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMigratedRef = useRef(false);

  // Lazy migration: ensure sync doc exists for legacy docs
  const needsMigration =
    !sync.isLoading && sync.initialContent === null && "create" in sync;
  useEffect(() => {
    if (needsMigration && !hasMigratedRef.current) {
      hasMigratedRef.current = true;
      ensureSyncDoc({ id: doc._id });
    }
  }, [needsMigration, doc._id, ensureSyncDoc]);

  const editor = useEditor(
    {
      extensions: sync.extension ? [...extensions, sync.extension] : extensions,
      content: sync.initialContent ?? undefined,
      editable: mode !== "viewing",
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm dark:prose-invert max-w-none min-h-[12rem] px-4 py-3 outline-none focus:outline-none",
        },
      },
    },
    [sync.extension ? "ready" : "loading"],
  );

  // Update editable when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(mode !== "viewing");
    }
  }, [editor, mode]);

  // Toggle suggestion tracking with the mode. Editing/Viewing apply edits
  // directly; Suggesting converts them into tracked-change marks.
  useEffect(() => {
    if (!editor) return;
    if (mode === "suggesting") enableSuggesting(editor);
    else disableSuggesting(editor);
  }, [editor, mode]);

  // Surface the pending-suggestion count so the header toggle can show it.
  const suggestionCount =
    useEditorState({
      editor,
      selector: ({ editor: e }) =>
        e ? collectSuggestions(e.state.doc).length : 0,
    }) ?? 0;
  useEffect(() => {
    onSuggestionCount(suggestionCount);
  }, [suggestionCount, onSuggestionCount]);

  // Version snapshot tracking
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = ({
      transaction,
    }: {
      transaction: Transaction;
    }) => {
      // Only local edits drive version snapshots; ignore remote (collab) steps
      // so another user's edits don't trigger or attribute a version here.
      if (transaction.getMeta("collab$")) return;
      editCountRef.current += 1;

      const now = Date.now();
      if (now - lastTouchDraftRef.current > 30_000) {
        lastTouchDraftRef.current = now;
        touchDraft({ docId: doc._id });
      }

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (editCountRef.current > 0 && editor) {
          const markdown = editor.getMarkdown();
          const pmContent = JSON.stringify(editor.state.doc.toJSON());
          saveVersion({
            docId: doc._id,
            content: markdown,
            pmContent,
          });
          editCountRef.current = 0;
        }
      }, 120_000);
    };

    editor.on("update", handleTransaction);
    return () => {
      editor.off("update", handleTransaction);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [editor, doc._id, touchDraft, saveVersion]);

  // Reflect open/active anchors as highlights in the document.
  useEffect(() => {
    if (!editor) return;
    setCommentHighlightState(editor, { openAnchorIds, activeAnchorId });
  }, [editor, openAnchorIds, activeAnchorId]);

  // Track anchors still present in the doc so deleted ones show as orphaned.
  useEffect(() => {
    if (!editor) return;
    const update = () =>
      setPresentAnchorIds(collectPresentAnchorIds(editor.state.doc));
    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  // Highlight click -> focus its thread in the panel.
  anchorClickRef.current = (anchorId: string) => {
    setActiveAnchorId(anchorId);
    if (!commentsOpen) onToggleComments();
  };

  // Panel thread click -> scroll the editor to the anchored text.
  const handleAnchorActivate = useCallback(
    (anchorId: string) => {
      setActiveAnchorId(anchorId);
      if (editor) scrollToAnchor(editor, anchorId);
    },
    [editor],
  );

  const handleStartComment = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, " ");
    const anchorId = nanoid();
    // Anchor the selection immediately so the pending highlight tracks edits.
    applyCommentAnchor(editor, anchorId);
    setComposingAnchorId(anchorId);
    setComposingAnchorText(text);
    setActiveAnchorId(anchorId);
    if (!commentsOpen) onToggleComments();
  }, [editor, commentsOpen, onToggleComments]);

  const handleCancelCompose = useCallback(() => {
    if (editor && composingAnchorId)
      removeCommentAnchor(editor, composingAnchorId);
    setComposingAnchorId(null);
    setComposingAnchorText(null);
  }, [editor, composingAnchorId]);

  const handleCommentCreated = useCallback(() => {
    setComposingAnchorId(null);
    setComposingAnchorText(null);
  }, []);

  const handleRestoreVersion = useCallback(
    (pmContent: string) => {
      if (!editor) return;
      // Snapshot the current state first so the restore is itself reversible
      // (dedupe in saveVersion makes this free when nothing changed).
      saveVersion({
        docId: doc._id,
        content: editor.getMarkdown(),
        pmContent: JSON.stringify(editor.state.doc.toJSON()),
      });
      try {
        const json = JSON.parse(pmContent);
        // Apply with skip meta so the restore is not turned into a tracked
        // suggestion while in Suggesting mode.
        setContentUntracked(editor, json);
      } catch {
        // ignore malformed snapshots
      }
      setSelectedVersionId(null);
    },
    [editor, doc._id, saveVersion],
  );

  if (sync.isLoading || (!sync.extension && sync.initialContent === null)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="mb-2 shrink-0 px-4">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Description
          </label>
          <Textarea
            value={doc.description ?? ""}
            onChange={(e) =>
              updateDoc({ id: doc._id, description: e.target.value })
            }
            placeholder="A short summary of this PRD."
            rows={2}
            className="scrollbar bg-card"
          />
        </section>

        {selectedVersionId ? (
          <div className="scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <DocVersionDiff
              versionId={selectedVersionId as Id<"docVersions">}
              currentContent={doc.content}
              onRestore={handleRestoreVersion}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
            <div
              ref={contentScrollRef}
              className="scrollbar min-h-0 flex-1 overflow-y-auto"
            >
              <EditorContent
                editor={editor}
                className="[&_.tiptap]:min-h-[12rem] [&_.tiptap]:outline-none"
              />
              {editor && (
                <BubbleMenu
                  editor={editor}
                  className="rounded-menu-item border border-border bg-popover p-1 shadow-md"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={handleStartComment}
                  >
                    <IconMessage size={14} />
                    Comment
                  </Button>
                </BubbleMenu>
              )}
            </div>

            {!commentsOpen &&
              !historyOpen &&
              !suggestionsOpen &&
              doc.content.trim().length > 0 && (
                <FloatingToc
                  containerRef={contentScrollRef}
                  content={doc.content}
                  className="hidden w-52 shrink-0 py-1 lg:block"
                />
              )}
          </div>
        )}
      </div>

      {commentsOpen && (
        <DocCommentsPanel
          docId={doc._id}
          activeAnchorId={activeAnchorId}
          onAnchorClick={handleAnchorActivate}
          onClose={onToggleComments}
          composingAnchorId={composingAnchorId}
          composingAnchorText={composingAnchorText}
          onCancelCompose={handleCancelCompose}
          onCommentCreated={handleCommentCreated}
          presentAnchorIds={presentAnchorIds}
        />
      )}

      {historyOpen && (
        <DocHistoryPanel
          docId={doc._id}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(id) => setSelectedVersionId(id)}
          onClose={onToggleHistory}
        />
      )}

      {suggestionsOpen && editor && (
        <DocSuggestionsPanel editor={editor} onClose={onToggleSuggestions} />
      )}
    </div>
  );
}
