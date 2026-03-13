"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef } from "react";

const EXTENSIONS = [
  StarterKit.configure({
    heading: false,
  }),
  Underline,
];

export function FormattedText({
  content,
  editable,
  className,
  onBlur,
}: {
  content: string;
  editable: boolean;
  className?: string;
  onBlur?: (html: string) => void;
}) {
  const prevEditable = useRef(editable);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    editable,
    immediatelyRender: false,
    onBlur: ({ editor: e }) => {
      if (onBlur) {
        onBlur(e.getHTML());
      }
    },
  });

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
}
