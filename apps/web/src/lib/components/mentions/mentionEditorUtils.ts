import { EDITOR_CHIP_CLICKABLE_CLASS } from "./mentionChipStyles";
import { LINK_URL_SOURCE, linkLabel } from "./linkChipUtils";

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

/** Builds an alternation regex that matches `/<label>` for each known skill label. */
export function buildSkillPattern(labels: string[]): RegExp {
  const sorted = [...labels].sort((a, b) => b.length - a.length);
  return new RegExp(`\\/(?:${sorted.map(escapeRegex).join("|")})`, "g");
}

export interface EditorChipSegment {
  type: "text" | "mention" | "skill" | "link";
  value: string;
}

/**
 * Link source is listed first so a full URL is consumed as one match before an
 * `@`/`/` label alternative could match a fragment inside it (e.g. the `/design`
 * segment of a Figma URL). Always includes the link source, so it is never null.
 */
function buildEditorChipPattern(
  mentionLabels: string[],
  skillLabels: string[],
): RegExp {
  const parts: string[] = [LINK_URL_SOURCE];
  for (const label of [...mentionLabels].sort((a, b) => b.length - a.length)) {
    parts.push(`@${escapeRegex(label)}`);
  }
  for (const label of [...skillLabels].sort((a, b) => b.length - a.length)) {
    parts.push(`\\/${escapeRegex(label)}`);
  }
  return new RegExp(parts.join("|"), "g");
}

function editorChipTypeFor(token: string): EditorChipSegment["type"] {
  if (/^https?:\/\//.test(token)) return "link";
  return token.startsWith("/") ? "skill" : "mention";
}

export function parseEditorChipSegments(
  value: string,
  mentionLabels: Iterable<string>,
  skillLabels: Iterable<string>,
): EditorChipSegment[] {
  const pattern = buildEditorChipPattern([...mentionLabels], [...skillLabels]);

  const segments: EditorChipSegment[] = [];
  let lastIndex = 0;
  for (const match of value.matchAll(pattern)) {
    const start = match.index;
    if (start === undefined) continue;
    if (start > lastIndex) {
      segments.push({ type: "text", value: value.slice(lastIndex, start) });
    }
    const token = match[0];
    segments.push({ type: editorChipTypeFor(token), value: token });
    lastIndex = start + token.length;
  }
  if (lastIndex < value.length) {
    segments.push({ type: "text", value: value.slice(lastIndex) });
  }
  return segments;
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
    if (start === undefined) continue;
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
  const mentionMap = new Map<string, string>();
  for (const label of labels) {
    mentionMap.set(label, label);
  }
  return renderEditorChipHtml(
    value,
    mentionMap,
    new Map(),
    chipClassName,
    chipClassName,
    false,
  );
}

function chipLabelFromToken(token: string): string {
  return token.startsWith("@") || token.startsWith("/")
    ? token.slice(1)
    : token;
}

function renderEditorChipSpan(
  segment: EditorChipSegment,
  chipClassName: string,
  label: string,
  hasResolvableId: boolean,
  clickable: boolean,
  dataKind: "mention" | "skill",
): string {
  const isClickable = clickable && hasResolvableId;
  const className = isClickable
    ? `${chipClassName} ${EDITOR_CHIP_CLICKABLE_CLASS}`
    : chipClassName;
  const labelAttr =
    dataKind === "mention" ? "data-mention-label" : "data-skill-label";
  return `​<span data-${dataKind}="true" ${labelAttr}="${escapeHtml(label)}" contenteditable="false" class="${escapeHtml(className)}">${escapeHtml(segment.value)}</span>​`;
}

export function renderEditorChipHtml(
  value: string,
  mentionLabelToId: ReadonlyMap<string, string>,
  skillLabelToId: ReadonlyMap<string, string>,
  mentionChipClassName: string,
  skillChipClassName: string,
  chipsClickable: boolean,
): string {
  const segments = parseEditorChipSegments(
    value,
    mentionLabelToId.keys(),
    skillLabelToId.keys(),
  );
  return segments
    .map((segment) => {
      if (segment.type === "link") {
        const url = segment.value;
        const className = `${mentionChipClassName} ${EDITOR_CHIP_CLICKABLE_CLASS}`;
        return `​<span data-link-url="${escapeHtml(url)}" contenteditable="false" class="${escapeHtml(className)}">${escapeHtml(linkLabel(url))}</span>​`;
      }
      if (segment.type === "mention") {
        const label = chipLabelFromToken(segment.value);
        return renderEditorChipSpan(
          segment,
          mentionChipClassName,
          label,
          mentionLabelToId.has(label),
          chipsClickable,
          "mention",
        );
      }
      if (segment.type === "skill") {
        const label = chipLabelFromToken(segment.value);
        return renderEditorChipSpan(
          segment,
          skillChipClassName,
          label,
          skillLabelToId.has(label),
          chipsClickable,
          "skill",
        );
      }
      return escapeHtml(segment.value).replace(/\n/g, "<br>");
    })
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
      const linkUrl = node.getAttribute("data-link-url");
      if (linkUrl !== null) {
        // Link chips display a friendly label but round-trip to the raw URL,
        // keeping the editor value in sync with what was pasted/persisted.
        out += linkUrl;
      } else if (node.tagName === "BR") {
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

/** Last client rect of a collapsed caret range, or null when unavailable. */
function caretRectFromRange(range: Range): DOMRect | null {
  const rects = range.getClientRects();
  const last = rects.item(rects.length - 1);
  if (last) return last;
  const rect = range.getBoundingClientRect();
  if (rect.height > 0 || rect.width > 0 || rect.top !== 0) return rect;
  return null;
}

/**
 * True when the collapsed caret sits on the first visual line of `el`. Lets a
 * chat composer recall history on ArrowUp without trapping multi-line editing.
 * A non-collapsed selection returns false (leave arrows to the browser); an
 * empty editor (no caret rect) returns true so history stays reachable.
 */
export function isCaretOnFirstLine(el: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return false;
  }
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer)) return false;
  const caret = caretRectFromRange(range);
  if (!caret) return true;
  const editorRect = el.getBoundingClientRect();
  const lineHeight = caret.height > 0 ? caret.height : 18;
  return caret.top - editorRect.top < lineHeight;
}

/** True when the collapsed caret sits on the last visual line of `el`. */
export function isCaretOnLastLine(el: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return false;
  }
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer)) return false;
  const caret = caretRectFromRange(range);
  if (!caret) return true;
  const editorRect = el.getBoundingClientRect();
  const lineHeight = caret.height > 0 ? caret.height : 18;
  return editorRect.bottom - caret.bottom < lineHeight;
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
