"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  Underline,
  Markdown.configure({
    markedOptions: {
      breaks: true,
    },
  }),
];

export interface FormattedTextHandle {
  getMarkdown: () => string;
}

export const FormattedText = forwardRef<
  FormattedTextHandle,
  {
    content: string;
    editable: boolean;
    className?: string;
    onBlur?: (markdown: string) => void;
  }
>(function FormattedText({ content, editable, className, onBlur }, ref) {
  const prevEditable = useRef(editable);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    editable,
    immediatelyRender: false,
    onBlur: ({ editor: e }) => {
      if (onBlur) {
        onBlur(e.getMarkdown());
      }
    },
  });

  useImperativeHandle(ref, () => ({
    getMarkdown: () => editor?.getMarkdown() ?? "",
  }));

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
    if (!prevEditable.current && editable) {
      editor.commands.focus("end");
    }
    prevEditable.current = editable;
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editable) return;
    editor.commands.setContent(content);
  }, [editor, content, editable]);

  return <EditorContent editor={editor} className={className} />;
});
