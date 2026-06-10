"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { useMutation } from "convex/react";
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
import { DocVersionDiff } from "./DocVersionDiff";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

const editorExtensions = [
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
}: {
  doc: Doc;
  commentsOpen: boolean;
  onToggleComments: () => void;
  historyOpen: boolean;
  onToggleHistory: () => void;
}) {
  const [mode] = useQueryState("mode", docModeParser);
  const ensureSyncDoc = useMutation(api.docs.ensureSyncDoc);
  const updateDoc = useMutation(api.docs.update);
  const touchDraft = useMutation(api.docVersions.touchDraft);
  const saveVersion = useMutation(api.docVersions.saveVersion);

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
      extensions: sync.extension
        ? [...editorExtensions, sync.extension]
        : editorExtensions,
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

  // Version snapshot tracking
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
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

  const handleStartComment = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, " ");
    const anchorId = nanoid();
    setComposingAnchorId(anchorId);
    setComposingAnchorText(text);
    setActiveAnchorId(anchorId);
    if (!commentsOpen) onToggleComments();
  }, [editor, commentsOpen, onToggleComments]);

  const handleCancelCompose = useCallback(() => {
    setComposingAnchorId(null);
    setComposingAnchorText(null);
  }, []);

  const handleCommentCreated = useCallback(() => {
    setComposingAnchorId(null);
    setComposingAnchorText(null);
  }, []);

  const handleRestoreVersion = useCallback(
    (pmContent: string) => {
      if (!editor) return;
      try {
        const json = JSON.parse(pmContent);
        editor.commands.setContent(json);
      } catch {
        // noop
      }
      setSelectedVersionId(null);
    },
    [editor],
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
                  className="rounded-md border border-border bg-popover p-1 shadow-md"
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

            {!commentsOpen && !historyOpen && doc.content.trim().length > 0 && (
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
          onAnchorClick={setActiveAnchorId}
          onClose={onToggleComments}
          composingAnchorId={composingAnchorId}
          composingAnchorText={composingAnchorText}
          onCancelCompose={handleCancelCompose}
          onCommentCreated={handleCommentCreated}
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
    </div>
  );
}
