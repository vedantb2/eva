interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBlockData(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

/** Mirrors the server mirror walker so client version snapshots match docs.content. */
export function pmJsonToMarkdown(node: PMNode, depth?: number): string {
  const d = depth ?? 0;
  if (node.type === "text") {
    let text = node.text ?? "";
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold" || mark.type === "strong") {
          text = `**${text}**`;
        } else if (mark.type === "italic" || mark.type === "em") {
          text = `*${text}*`;
        } else if (mark.type === "code") {
          text = `\`${text}\``;
        } else if (mark.type === "link") {
          text = `[${text}](${String(mark.attrs?.href ?? "")})`;
        } else if (mark.type === "deletion") {
          return "";
        }
      }
    }
    return text;
  }

  const children = (node.content ?? [])
    .map((child) => pmJsonToMarkdown(child, d))
    .join("");

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return children + "\n\n";
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      return "#".repeat(level) + " " + children + "\n\n";
    }
    case "bulletList":
      return (node.content ?? [])
        .map((li) => "- " + pmJsonToMarkdown(li, d + 1).trimStart())
        .join("");
    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => `${i + 1}. ` + pmJsonToMarkdown(li, d + 1).trimStart())
        .join("");
    case "listItem":
      return children;
    case "codeBlock": {
      const lang = String(node.attrs?.language ?? "");
      return "```" + lang + "\n" + children + "```\n\n";
    }
    case "evaBlock": {
      const blockType = String(node.attrs?.blockType ?? "callout");
      const data = readBlockData(node.attrs?.data);
      return (
        "```eva:" +
        blockType +
        "\n" +
        JSON.stringify(data, null, 2) +
        "\n```\n\n"
      );
    }
    case "blockquote":
      return (
        children
          .split("\n")
          .map((line) => "> " + line)
          .join("\n") + "\n"
      );
    case "horizontalRule":
      return "---\n\n";
    case "hardBreak":
      return "\n";
    default:
      return children;
  }
}

export function editorDocToMarkdown(docJson: PMNode): string {
  return pmJsonToMarkdown(docJson).trim();
}
