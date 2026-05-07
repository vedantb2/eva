function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds an alternation regex that matches `@<label>` for each known label.
 * Sorted longest-first so longer labels win when one is a prefix of another.
 */
export function buildMentionPattern(labels: string[]): RegExp {
  const sorted = [...labels].sort((a, b) => b.length - a.length);
  return new RegExp(`@(?:${sorted.map(escapeRegex).join("|")})`, "g");
}

export interface MentionSegment {
  type: "text" | "mention";
  value: string;
}

export function parseSegments(
  value: string,
  labels: Iterable<string>,
): MentionSegment[] {
  const labelArray = [...labels];
  if (labelArray.length === 0) return [{ type: "text", value }];
  const pattern = buildMentionPattern(labelArray);
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  for (const match of value.matchAll(pattern)) {
    const start = match.index;
    if (start > lastIndex) {
      segments.push({ type: "text", value: value.slice(lastIndex, start) });
    }
    segments.push({ type: "mention", value: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < value.length) {
    segments.push({ type: "text", value: value.slice(lastIndex) });
  }
  return segments;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMentionHtml(
  value: string,
  labels: Iterable<string>,
  chipClassName: string,
): string {
  const segments = parseSegments(value, labels);
  return segments
    .map((s) =>
      s.type === "mention"
        ? `​<span data-mention="true" contenteditable="false" class="${escapeHtml(chipClassName)}">${escapeHtml(s.value)}</span>​`
        : escapeHtml(s.value).replace(/\n/g, "<br>"),
    )
    .join("");
}

/** Strip the zero-width spaces injected around mention chips. */
export function normalizeMentionText(text: string): string {
  return text.replace(/​/g, "");
}

/** Walk a contentEditable subtree and reconstruct the text the user sees. */
export function extractEditableText(el: Element): string {
  let out = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof Element) {
      if (node.tagName === "BR") {
        out += "\n";
      } else if (node.tagName === "DIV" || node.tagName === "P") {
        if (out !== "" && !out.endsWith("\n")) out += "\n";
        out += extractEditableText(node);
      } else {
        out += extractEditableText(node);
      }
    }
  }
  return out;
}

export function placeCursorAtEnd(el: Element): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
