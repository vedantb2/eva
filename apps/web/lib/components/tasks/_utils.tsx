import { Fragment } from "react";

type InlineNode =
  | string
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "underline"; content: string }
  | { type: "strikethrough"; content: string };

const INLINE_PATTERN =
  /(\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|~~(.+?)~~)/g;

function parseInlineFormatting(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push({ type: "bold", content: match[2] });
    } else if (match[3]) {
      nodes.push({ type: "underline", content: match[3] });
    } else if (match[4]) {
      nodes.push({ type: "italic", content: match[4] });
    } else if (match[5]) {
      nodes.push({ type: "strikethrough", content: match[5] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function FormattedText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const nodes = parseInlineFormatting(children);

  return (
    <div className={className}>
      {nodes.map((node, i) => {
        if (typeof node === "string") {
          return <Fragment key={i}>{node}</Fragment>;
        }
        switch (node.type) {
          case "bold":
            return <strong key={i}>{node.content}</strong>;
          case "italic":
            return <em key={i}>{node.content}</em>;
          case "underline":
            return <u key={i}>{node.content}</u>;
          case "strikethrough":
            return <s key={i}>{node.content}</s>;
        }
      })}
    </div>
  );
}
