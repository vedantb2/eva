import type { JSONContent } from "@tiptap/core";

const EVA_FENCE_PREFIX = "eva:";

export function evaBlockToMarkdown(
  blockType: string,
  data: Record<string, unknown>,
): string {
  return (
    "```" +
    EVA_FENCE_PREFIX +
    blockType +
    "\n" +
    JSON.stringify(data, null, 2) +
    "\n```\n\n"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEvaFenceLanguage(language: string): string | null {
  if (!language.startsWith(EVA_FENCE_PREFIX)) return null;
  const blockType = language.slice(EVA_FENCE_PREFIX.length);
  return blockType.length > 0 ? blockType : null;
}

function newBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Converts codeBlock nodes with `eva:` language into evaBlock nodes. */
export function convertEvaFencesInDocJson(doc: JSONContent): JSONContent {
  if (!doc.content) return doc;
  return {
    ...doc,
    content: doc.content.map((node) => convertEvaFencesInNode(node)),
  };
}

function convertEvaFencesInNode(node: JSONContent): JSONContent {
  if (node.type === "codeBlock" && typeof node.attrs?.language === "string") {
    const blockType = parseEvaFenceLanguage(node.attrs.language);
    if (blockType) {
      const text = extractTextFromNode(node);
      try {
        const parsed: unknown = JSON.parse(text);
        if (isRecord(parsed)) {
          return {
            type: "evaBlock",
            attrs: {
              blockId: newBlockId(),
              blockType,
              data: parsed,
            },
          };
        }
      } catch {
        return node;
      }
    }
  }

  if (node.content) {
    return {
      ...node,
      content: node.content.map((child) => convertEvaFencesInNode(child)),
    };
  }
  return node;
}

function extractTextFromNode(node: JSONContent): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map((child) => extractTextFromNode(child)).join("");
}
