"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

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
    if (editable) {
      editor.commands.focus("end");
    }
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editable) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== content) {
      editor.commands.setContent(content);
    }
  }, [editor, content, editable]);

  return <EditorContent editor={editor} className={className} />;
}
