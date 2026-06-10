"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { forwardRef, useImperativeHandle } from "react";

const prdExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  Markdown.configure({
    markedOptions: {
      gfm: true,
    },
  }),
];

function getMarkdownFromEditor(editor: Editor): string {
  return editor.getMarkdown();
}

export interface SessionPrdPlanEditorHandle {
  getMarkdown: () => string | null;
}

interface SessionPrdPlanEditorProps {
  initialMarkdown: string;
}

export const SessionPrdPlanEditor = forwardRef<
  SessionPrdPlanEditorHandle,
  SessionPrdPlanEditorProps
>(function SessionPrdPlanEditor({ initialMarkdown }, ref) {
  const editor = useEditor({
    extensions: prdExtensions,
    content: initialMarkdown,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[12rem] px-3 py-2 outline-none focus:outline-none",
      },
    },
  });

  useImperativeHandle(ref, () => ({
    getMarkdown: () => (editor ? getMarkdownFromEditor(editor) : null),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted/40">
        <EditorContent
          editor={editor}
          className="[&_.tiptap]:min-h-[12rem] [&_.tiptap]:outline-none"
        />
      </div>
    </div>
  );
});
