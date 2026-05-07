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
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { formatMentionToken } from "@/lib/components/chat/mentionToken";

export interface CommentMentionInputHandle {
  tokenize: (text: string) => string;
  reset: () => void;
}

interface CommentMentionInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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

interface MentionItem {
  id: Id<"users">;
  label: string;
  email: string | undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMentionPattern(labels: string[]): RegExp {
  const sorted = [...labels].sort((a, b) => b.length - a.length);
  return new RegExp(`@(?:${sorted.map(escapeRegex).join("|")})`, "g");
}

interface Segment {
  type: "text" | "mention";
  value: string;
}

function parseSegments(
  value: string,
  mentionMap: Map<string, Id<"users">>,
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

function renderHtml(
  value: string,
  mentionMap: Map<string, Id<"users">>,
): string {
  const segments = parseSegments(value, mentionMap);
  return segments
    .map((s) =>
      s.type === "mention"
        ? `​<span data-mention="true" contenteditable="false" class="rounded-md bg-muted px-1 font-medium text-foreground">${escapeHtml(s.value)}</span>​`
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

export const CommentMentionInput = forwardRef<
  CommentMentionInputHandle,
  CommentMentionInputProps
>(function CommentMentionInput(
  { value, onValueChange, placeholder, className },
  ref,
) {
  const { repo } = useRepo();
  const members = useQuery(
    api.teamMembers.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );

  const editorRef = useRef<HTMLDivElement>(null);
  const [mention, setMention] = useState<MentionState>(CLOSED_MENTION);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mentionMap, setMentionMap] = useState<Map<string, Id<"users">>>(
    () => new Map(),
  );
  const [isComposing, setIsComposing] = useState(false);

  const items: MentionItem[] = (members ?? []).flatMap((m) => {
    if (!m.user) return [];
    const label = m.user.fullName?.trim() || m.user.email?.trim();
    if (!label) return [];
    return [{ id: m.user._id, label, email: m.user.email }];
  });

  // Reconcile DOM only when external value diverges from what user typed.
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
          const label = m.slice(1);
          const userId = mentionMap.get(label);
          return userId ? formatMentionToken(label, userId) : m;
        });
      },
      reset: () => {
        setMentionMap(new Map());
      },
    }),
    [mentionMap],
  );

  const filteredItems = items
    .filter((item) =>
      item.label.toLowerCase().includes(mention.query.toLowerCase()),
    )
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 8);

  const closeMention = useCallback(() => {
    setMention((prev) => (prev.isOpen ? CLOSED_MENTION : prev));
    setSelectedIndex(0);
  }, []);

  const insertMention = useCallback(
    (item: MentionItem) => {
      const visible = `@${item.label}`;
      const before = value.slice(0, mention.startIndex);
      const after = value.slice(mention.startIndex + mention.query.length + 1);
      const newValue = before + visible + " " + after;
      setMentionMap((prev) => {
        const next = new Map(prev);
        next.set(item.label, item.id);
        return next;
      });
      onValueChange(newValue);
      closeMention();
      requestAnimationFrame(() => editorRef.current?.focus());
    },
    [
      onValueChange,
      mention.startIndex,
      mention.query.length,
      closeMention,
      value,
    ],
  );

  // Detect "@" trigger from the current text.
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

  // Position popup above the editor.
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
      onValueChange(text);
    }
  }, [onValueChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (mention.isOpen && filteredItems.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev >= filteredItems.length - 1 ? 0 : prev + 1,
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? filteredItems.length - 1 : prev - 1,
          );
          return;
        }
        if (e.key === "Enter") {
          if (isComposing || e.nativeEvent.isComposing) return;
          e.preventDefault();
          e.stopPropagation();
          const item = filteredItems[selectedIndex];
          if (item) insertMention(item);
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          const item = filteredItems[selectedIndex];
          if (item) insertMention(item);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeMention();
          return;
        }
      }
    },
    [
      mention.isOpen,
      filteredItems,
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

  const isEmpty = value === "" || value === "\n";

  const popup =
    mention.isOpen && filteredItems.length > 0 ? (
      <div
        className="fixed z-50 overflow-hidden rounded-md bg-popover py-1 text-popover-foreground shadow-md"
        style={{
          left: position.left,
          top: position.top - 8,
          width: position.width,
          transform: "translateY(-100%)",
        }}
      >
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertMention(item);
            }}
            className={
              "flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm " +
              (index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground")
            }
          >
            <span className="truncate">@{item.label}</span>
            {item.email && item.email !== item.label && (
              <span className="truncate text-xs text-muted-foreground">
                {item.email}
              </span>
            )}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <>
      <div
        ref={editorRef}
        data-placeholder={placeholder ?? ""}
        data-empty={isEmpty ? "true" : undefined}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder ?? "Comment input"}
        className={
          "block min-h-16 max-h-40 w-full overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-input bg-transparent px-3 py-2 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-[empty]:before:pointer-events-none data-[empty]:before:select-none data-[empty]:before:text-muted-foreground/90 data-[empty]:before:content-[attr(data-placeholder)] " +
          (className ?? "")
        }
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
