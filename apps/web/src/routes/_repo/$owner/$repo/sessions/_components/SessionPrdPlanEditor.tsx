"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { useCallback } from "react";
import { Button } from "@conductor/ui";
import { IconCheck, IconX } from "@tabler/icons-react";

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

interface SessionPrdPlanEditorProps {
  initialMarkdown: string;
  onSave: (markdown: string) => void | Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function SessionPrdPlanEditor({
  initialMarkdown,
  onSave,
  onCancel,
  isSaving,
}: SessionPrdPlanEditorProps) {
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

  const handleSave = useCallback(() => {
    if (!editor) return;
    const md = getMarkdownFromEditor(editor);
    void onSave(md);
  }, [editor, onSave]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted/40">
        <EditorContent
          editor={editor}
          className="[&_.tiptap]:min-h-[12rem] [&_.tiptap]:outline-none"
        />
      </div>
      <div className="flex shrink-0 justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isSaving}
          onClick={onCancel}
        >
          <IconX className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isSaving || !editor}
          onClick={handleSave}
        >
          <IconCheck className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}
