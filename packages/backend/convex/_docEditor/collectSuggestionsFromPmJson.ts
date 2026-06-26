type PMNode = {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
  content?: PMNode[];
  text?: string;
  marks?: Array<{
    type: string;
    attrs?: Record<string, string | number | boolean | null>;
  }>;
};

export type SuggestionKind = "insertion" | "deletion" | "modification";

export type SuggestionFromPmJson = {
  id: string;
  kind: SuggestionKind;
  text: string;
  userId: string | null;
  createdAt: number | null;
};

function toSuggestionKind(markName: string): SuggestionKind | null {
  if (
    markName === "insertion" ||
    markName === "deletion" ||
    markName === "modification"
  ) {
    return markName;
  }
  return null;
}

export function parseSuggestionAuthor(id: string): {
  userId: string | null;
  createdAt: number | null;
} {
  const parts = id.split("|");
  if (parts.length < 2) return { userId: null, createdAt: null };
  const userId = parts[0] && parts[0] !== "unknown" ? parts[0] : null;
  const ts = Number(parts[1]);
  return { userId, createdAt: Number.isFinite(ts) ? ts : null };
}

/** Walks PM JSON and groups suggestion marks by id (no ProseMirror dependency). */
export function collectSuggestionsFromPmJson(
  doc: PMNode,
): SuggestionFromPmJson[] {
  const byId = new Map<string, SuggestionFromPmJson>();

  function walk(node: PMNode): void {
    if (node.text) {
      const marks = node.marks ?? [];
      for (const mark of marks) {
        const kind = toSuggestionKind(mark.type);
        if (!kind) continue;
        const id = String(mark.attrs?.id ?? "");
        if (!id) continue;
        const existing = byId.get(id);
        const text = node.text;
        if (existing) {
          existing.text += text;
        } else {
          const { userId, createdAt } = parseSuggestionAuthor(id);
          byId.set(id, { id, kind, text, userId, createdAt });
        }
      }
    }
    for (const child of node.content ?? []) {
      walk(child);
    }
  }

  walk(doc);
  return [...byId.values()].sort((a, b) => {
    const aTime = a.createdAt ?? 0;
    const bTime = b.createdAt ?? 0;
    return aTime - bTime;
  });
}
