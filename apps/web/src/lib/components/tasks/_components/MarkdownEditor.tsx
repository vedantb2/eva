"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { cn } from "@conductor/ui";

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  Underline,
  Markdown.configure({
    markedOptions: {
      gfm: true,
    },
  }),
];

export interface MarkdownEditorHandle {
  getMarkdown: () => string;
  focus: () => void;
}

interface MarkdownEditorProps {
  content: string;
  editable: boolean;
  className?: string;
  placeholder?: string;
  minHeight?: string;
  onBlur?: (markdown: string) => void;
}

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  MarkdownEditorProps
>(function MarkdownEditor(
  { content, editable, className, placeholder, minHeight, onBlur },
  ref,
) {
  const prevEditable = useRef(editable);
  const prevContent = useRef(content);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    contentType: "markdown",
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          "outline-none",
          "[&_p]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          minHeight,
        ),
      },
    },
    onBlur: ({ editor: e }) => {
      onBlur?.(e.getMarkdown());
    },
  });

  useImperativeHandle(ref, () => ({
    getMarkdown: () => editor?.getMarkdown() ?? "",
    focus: () => editor?.commands.focus("end"),
  }));

  // Toggle editable state and focus when entering edit mode
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
    if (!prevEditable.current && editable) {
      editor.commands.focus("end");
    }
    prevEditable.current = editable;
  }, [editor, editable]);

  // Sync content from external source when not editing
  useEffect(() => {
    if (!editor || editable) return;
    // Only update if content actually changed (avoid unnecessary re-renders)
    if (prevContent.current !== content) {
      editor.commands.setContent(content, { contentType: "markdown" });
      prevContent.current = content;
    }
  }, [editor, content, editable]);

  // Build placeholder style
  const placeholderStyle = placeholder
    ? {
        "--placeholder-text": `"${placeholder}"`,
      }
    : undefined;

  return (
    <EditorContent
      editor={editor}
      style={placeholderStyle as React.CSSProperties}
      className={cn(
        className,
        placeholder &&
          "[&_.tiptap.is-editor-empty:first-child]:before:content-[var(--placeholder-text)] [&_.tiptap.is-editor-empty:first-child]:before:text-muted-foreground [&_.tiptap.is-editor-empty:first-child]:before:pointer-events-none [&_.tiptap.is-editor-empty:first-child]:before:float-left [&_.tiptap.is-editor-empty:first-child]:before:h-0",
      )}
    />
  );
});
