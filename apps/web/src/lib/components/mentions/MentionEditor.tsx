"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { formatMentionToken } from "./mentionToken";
import {
  buildMentionPattern,
  extractEditableText,
  normalizeMentionText,
  placeCursorAtEnd,
  renderMentionHtml,
} from "./mentionEditorUtils";

const DEFAULT_CHIP_CLASS = "rounded bg-muted px-1 font-medium text-foreground";

const DEFAULT_EDITOR_CLASS =
  "block w-full whitespace-pre-wrap break-words bg-transparent text-sm outline-none data-[empty]:before:pointer-events-none data-[empty]:before:select-none data-[empty]:before:text-muted-foreground/90 data-[empty]:before:content-[attr(data-placeholder)]";

export interface MentionItem<TId extends string = string> {
  id: TId;
  label: string;
}

export interface MentionEditorHandle {
  tokenize: (text: string) => string;
  reset: () => void;
  focus: () => void;
}

export interface MentionEditorProps<TItem extends MentionItem = MentionItem> {
  value: string;
  onValueChange: (value: string) => void;
  items: TItem[];
  placeholder?: string;
  className?: string;
  chipClassName?: string;
  /** If provided, Enter triggers this; Shift+Enter still inserts a newline. Otherwise Enter inserts a newline. */
  onEnterSubmit?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Custom popup row content for each item. Defaults to `@{label}`. */
  renderItem?: (item: TItem, isSelected: boolean) => ReactNode;
  /** Custom filter for the popup; defaults to case-insensitive substring on `label`. */
  filterItem?: (item: TItem, query: string) => boolean;
  maxItems?: number;
  /** Optional `data-slot` attribute, useful when nesting inside `InputGroup`. */
  dataSlot?: string;
  ariaLabel?: string;
  ref?: Ref<MentionEditorHandle>;
}

interface TriggerState {
  isOpen: boolean;
  query: string;
  startIndex: number;
}

const CLOSED_TRIGGER: TriggerState = {
  isOpen: false,
  query: "",
  startIndex: 0,
};

function defaultRenderItem(item: MentionItem): ReactNode {
  return <span className="block w-full truncate">@{item.label}</span>;
}

function defaultFilter(item: MentionItem, query: string): boolean {
  return item.label.toLowerCase().includes(query.toLowerCase());
}

export function MentionEditor<TItem extends MentionItem = MentionItem>({
  ref,
  value,
  onValueChange,
  items,
  placeholder,
  className,
  chipClassName = DEFAULT_CHIP_CLASS,
  onEnterSubmit,
  renderItem = defaultRenderItem,
  filterItem = defaultFilter,
  maxItems = 8,
  dataSlot,
  ariaLabel,
}: MentionEditorProps<TItem>) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [trigger, setTrigger] = useState<TriggerState>(CLOSED_TRIGGER);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mentionMap, setMentionMap] = useState<Map<string, TItem["id"]>>(
    () => new Map(),
  );
  const [isComposing, setIsComposing] = useState(false);

  // Auto-reset the mention map after the value clears (e.g. post-submit).
  useEffect(() => {
    if (value === "" && mentionMap.size > 0) {
      setMentionMap(new Map());
    }
  }, [value, mentionMap.size]);

  // Reconcile DOM with external value. During typing, onInput already pushed
  // the text upward, so DOM === value here and we skip — preserving the caret.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (normalizeMentionText(extractEditableText(el)) !== value) {
      el.innerHTML = renderMentionHtml(value, mentionMap.keys(), chipClassName);
      placeCursorAtEnd(el);
    }
  }, [value, mentionMap, chipClassName]);

  useImperativeHandle(
    ref,
    () => ({
      tokenize: (text: string) => {
        if (mentionMap.size === 0) return text;
        const pattern = buildMentionPattern([...mentionMap.keys()]);
        return text.replace(pattern, (m) => {
          const label = m.slice(1);
          const id = mentionMap.get(label);
          return id ? formatMentionToken(label, id) : m;
        });
      },
      reset: () => setMentionMap(new Map()),
      focus: () => editorRef.current?.focus(),
    }),
    [mentionMap],
  );

  const filteredItems = items
    .filter((item) => filterItem(item, trigger.query))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, maxItems);

  const closeTrigger = useCallback(() => {
    setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
    setSelectedIndex(0);
  }, []);

  const insertItem = useCallback(
    (item: TItem) => {
      const visible = `@${item.label}`;
      const before = value.slice(0, trigger.startIndex);
      const after = value.slice(trigger.startIndex + trigger.query.length + 1);
      const newValue = before + visible + " " + after;
      setMentionMap((prev) => {
        const next = new Map(prev);
        next.set(item.label, item.id);
        return next;
      });
      onValueChange(newValue);
      closeTrigger();
      requestAnimationFrame(() => editorRef.current?.focus());
    },
    [
      onValueChange,
      trigger.startIndex,
      trigger.query.length,
      closeTrigger,
      value,
    ],
  );

  // Detect "@" trigger.
  useEffect(() => {
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex === -1) {
      setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
      return;
    }
    const textAfterAt = value.slice(lastAtIndex + 1);
    if (textAfterAt.includes("\n") || /\s/.test(textAfterAt)) {
      setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
      return;
    }
    const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : "";
    const isStartOfWord =
      lastAtIndex === 0 ||
      (charBeforeAt !== undefined && /\s/.test(charBeforeAt));
    if (!isStartOfWord) {
      setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
      return;
    }
    setTrigger({
      isOpen: true,
      query: textAfterAt,
      startIndex: lastAtIndex,
    });
    setSelectedIndex(0);
  }, [value]);

  // Position popup above the editor.
  useEffect(() => {
    if (!trigger.isOpen) return;
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
  }, [trigger.isOpen]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = normalizeMentionText(extractEditableText(el));
    if (text !== value) {
      onValueChange(text);
    }
  }, [onValueChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (trigger.isOpen && filteredItems.length > 0) {
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
          if (item) insertItem(item);
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          const item = filteredItems[selectedIndex];
          if (item) insertItem(item);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeTrigger();
          return;
        }
      }

      if (e.key === "Enter" && onEnterSubmit) {
        if (isComposing || e.nativeEvent.isComposing) return;
        if (e.shiftKey) return;
        e.preventDefault();
        onEnterSubmit(e);
      }
    },
    [
      trigger.isOpen,
      filteredItems,
      selectedIndex,
      insertItem,
      closeTrigger,
      isComposing,
      onEnterSubmit,
    ],
  );

  const handleBlur = useCallback(() => {
    if (trigger.isOpen) closeTrigger();
  }, [trigger.isOpen, closeTrigger]);

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
    trigger.isOpen && filteredItems.length > 0 ? (
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
              insertItem(item);
            }}
            className={
              "flex w-full items-baseline px-3 py-1.5 text-left text-sm " +
              (index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground")
            }
          >
            {renderItem(item, index === selectedIndex)}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <>
      <div
        ref={editorRef}
        data-slot={dataSlot}
        data-placeholder={placeholder ?? ""}
        data-empty={isEmpty ? "true" : undefined}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel ?? placeholder ?? "Editor"}
        className={
          className
            ? `${DEFAULT_EDITOR_CLASS} ${className}`
            : DEFAULT_EDITOR_CLASS
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
}
