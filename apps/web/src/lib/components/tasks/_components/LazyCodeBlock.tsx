"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      wrapLines
      wrapLongLines
      customStyle={{
        fontSize: "0.75rem",
        borderRadius: "0.5rem",
        margin: 0,
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
