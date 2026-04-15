import type { MarkdownManager } from "@tiptap/markdown";

declare module "@tiptap/core" {
  interface EditorOptions {
    contentType?: "markdown" | "json" | "html";
  }

  interface Editor {
    markdown: MarkdownManager;
    getMarkdown: () => string;
  }
}
