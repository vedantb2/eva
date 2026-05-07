"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { usePromptInputController } from "@conductor/ui";
import type { Doc } from "@conductor/backend";
import { formatMentionToken } from "./mentionToken";

export interface MentionTextareaHandle {
  tokenize: (text: string) => string;
}

interface MentionTextareaProps {
  docs: Array<Doc<"docs">>;
  placeholder?: string;
}

interface MentionState {
  isOpen: boolean;
  query: string;
  startIndex: number;
}

const CLOSED_MENTION: MentionState = {
  isOpen: false,
  query: "",
  startIndex: 0,
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMentionPattern(titles: string[]): RegExp {
  const sorted = [...titles].sort((a, b) => b.length - a.length);
  return new RegExp(`@(?:${sorted.map(escapeRegex).join("|")})`, "g");
}

interface Segment {
  type: "text" | "mention";
  value: string;
}

function parseSegments(
  value: string,
  mentionMap: Map<string, string>,
): Segment[] {
  if (mentionMap.size === 0) return [{ type: "text", value }];
  const pattern = buildMentionPattern([...mentionMap.keys()]);
  const segments: Segment[] = [];
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHtml(value: string, mentionMap: Map<string, string>): string {
  const segments = parseSegments(value, mentionMap);
  return segments
    .map((s) =>
      s.type === "mention"
        ? `​<span data-mention="true" contenteditable="false" class="rounded-md bg-muted/60 px-1 font-bold">${escapeHtml(s.value)}</span>​`
        : escapeHtml(s.value).replace(/\n/g, "<br>"),
    )
    .join("");
}

function normalize(text: string): string {
  return text.replace(/​/g, "");
}

function extractText(el: Element): string {
  let out = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof Element) {
      if (node.tagName === "BR") {
        out += "\n";
      } else if (node.tagName === "DIV" || node.tagName === "P") {
        if (out !== "" && !out.endsWith("\n")) out += "\n";
        out += extractText(node);
      } else {
        out += extractText(node);
      }
    }
  }
  return out;
}

function placeCursorAtEnd(el: Element): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

export const MentionTextarea = forwardRef<
  MentionTextareaHandle,
  MentionTextareaProps
>(function MentionTextarea({ docs, placeholder }, ref) {
  const controller = usePromptInputController();
  const editorRef = useRef<HTMLDivElement>(null);
  const [mention, setMention] = useState<MentionState>(CLOSED_MENTION);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mentionMap, setMentionMap] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [isComposing, setIsComposing] = useState(false);

  const value = controller.textInput.value;

  // Reset mention map when controller is cleared (after submit)
  useEffect(() => {
    if (value === "" && mentionMap.size > 0) {
      setMentionMap(new Map());
    }
  }, [value, mentionMap.size]);

  // Reconcile DOM only when external value diverges from what user typed.
  // During typing, onInput already pushed the value upward, so DOM === value
  // and we skip — preserving the caret position.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (normalize(extractText(el)) !== value) {
      el.innerHTML = renderHtml(value, mentionMap);
      placeCursorAtEnd(el);
    }
  }, [value, mentionMap]);

  useImperativeHandle(
    ref,
    () => ({
      tokenize: (text) => {
        if (mentionMap.size === 0) return text;
        const pattern = buildMentionPattern([...mentionMap.keys()]);
        return text.replace(pattern, (m) => {
          const title = m.slice(1);
          const docId = mentionMap.get(title);
          return docId ? formatMentionToken(title, docId) : m;
        });
      },
    }),
    [mentionMap],
  );

  const filteredDocs = docs
    .filter((d) => d.title.toLowerCase().includes(mention.query.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 8);

  const closeMention = useCallback(() => {
    setMention((prev) => (prev.isOpen ? CLOSED_MENTION : prev));
    setSelectedIndex(0);
  }, []);

  const insertMention = useCallback(
    (doc: Doc<"docs">) => {
      const visible = `@${doc.title}`;
      const before = value.slice(0, mention.startIndex);
      const after = value.slice(mention.startIndex + mention.query.length + 1);
      const newValue = before + visible + " " + after;
      setMentionMap((prev) => {
        const next = new Map(prev);
        next.set(doc.title, doc._id);
        return next;
      });
      controller.textInput.setInput(newValue);
      closeMention();
      requestAnimationFrame(() => editorRef.current?.focus());
    },
    [
      controller.textInput,
      mention.startIndex,
      mention.query.length,
      closeMention,
      value,
    ],
  );

  // Detect "@" trigger from the current text
  useEffect(() => {
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex === -1) {
      setMention((prev) => (prev.isOpen ? CLOSED_MENTION : prev));
      return;
    }
    const textAfterAt = value.slice(lastAtIndex + 1);
    if (textAfterAt.includes("\n") || /\s/.test(textAfterAt)) {
      setMention((prev) => (prev.isOpen ? CLOSED_MENTION : prev));
      return;
    }
    const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : "";
    const isStartOfWord =
      lastAtIndex === 0 ||
      (charBeforeAt !== undefined && /\s/.test(charBeforeAt));
    if (!isStartOfWord) {
      setMention((prev) => (prev.isOpen ? CLOSED_MENTION : prev));
      return;
    }
    setMention({
      isOpen: true,
      query: textAfterAt,
      startIndex: lastAtIndex,
    });
    setSelectedIndex(0);
  }, [value]);

  // Position popup above the editor
  useEffect(() => {
    if (!mention.isOpen) return;
    const update = () => {
      const el = editorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [mention.isOpen]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = normalize(extractText(el));
    if (text !== value) {
      controller.textInput.setInput(text);
    }
  }, [controller.textInput, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (mention.isOpen && filteredDocs.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev >= filteredDocs.length - 1 ? 0 : prev + 1,
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? filteredDocs.length - 1 : prev - 1,
          );
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          const doc = filteredDocs[selectedIndex];
          if (doc) insertMention(doc);
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          const doc = filteredDocs[selectedIndex];
          if (doc) insertMention(doc);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeMention();
          return;
        }
      }

      if (e.key === "Enter") {
        if (isComposing || e.nativeEvent.isComposing) return;
        if (e.shiftKey) return;
        e.preventDefault();
        const form = e.currentTarget.closest("form");
        if (!(form instanceof HTMLFormElement)) return;
        const submitButton = form.querySelector('button[type="submit"]');
        if (
          submitButton instanceof HTMLButtonElement &&
          submitButton.disabled
        ) {
          return;
        }
        form.requestSubmit();
      }
    },
    [
      mention.isOpen,
      filteredDocs,
      selectedIndex,
      insertMention,
      closeMention,
      isComposing,
    ],
  );

  const handleBlur = useCallback(() => {
    if (mention.isOpen) closeMention();
  }, [mention.isOpen, closeMention]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      handleInput();
    },
    [handleInput],
  );

  // Browsers (notably Firefox) auto-insert a <br> into an empty contentEditable.
  // Treat a lone newline as visually empty so the placeholder remains visible.
  const isEmpty = value === "" || value === "\n";

  const popup =
    mention.isOpen && filteredDocs.length > 0 ? (
      <div
        className="fixed z-50 overflow-hidden rounded-md bg-popover py-1 text-popover-foreground shadow-md"
        style={{
          left: position.left,
          top: position.top - 8,
          width: position.width,
          transform: "translateY(-100%)",
        }}
      >
        {filteredDocs.map((doc, index) => (
          <button
            key={doc._id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertMention(doc);
            }}
            className={
              "block w-full truncate px-3 py-1.5 text-left text-sm " +
              (index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground")
            }
          >
            @{doc.title}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <>
      <div
        ref={editorRef}
        data-slot="input-group-control"
        data-placeholder={placeholder ?? ""}
        data-empty={isEmpty ? "true" : undefined}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder ?? "Message input"}
        className="block min-h-16 max-h-40 w-full self-stretch overflow-y-auto whitespace-pre-wrap break-words bg-transparent px-3.5 py-3 text-left text-sm outline-none focus-visible:outline-none data-[empty]:before:pointer-events-none data-[empty]:before:select-none data-[empty]:before:text-muted-foreground/90 data-[empty]:before:content-[attr(data-placeholder)]"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
      />
      {popup && typeof document !== "undefined"
        ? createPortal(popup, document.body)
        : null}
    </>
  );
});
