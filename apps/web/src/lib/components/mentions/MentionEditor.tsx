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
import { formatSkillToken } from "./skillToken";
import {
  buildMentionPattern,
  buildSkillPattern,
  extractEditableText,
  normalizeMentionText,
  placeCursorAtEnd,
  renderEditorChipHtml,
} from "./mentionEditorUtils";

const DEFAULT_CHIP_CLASS = "rounded bg-muted px-1 font-medium text-foreground";
const DEFAULT_SKILL_CHIP_CLASS =
  "rounded-md bg-muted/60 px-1 font-medium text-foreground";

const DEFAULT_EDITOR_CLASS =
  "relative block w-full whitespace-pre-wrap break-words bg-transparent text-sm outline-none data-[empty]:before:pointer-events-none data-[empty]:before:select-none data-[empty]:before:absolute data-[empty]:before:text-muted-foreground/90 data-[empty]:before:content-[attr(data-placeholder)]";

export interface MentionItem<TId extends string = string> {
  id: TId;
  label: string;
  description?: string;
}

export interface SlashItem<
  TId extends string = string,
> extends MentionItem<TId> {
  prompt?: string;
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
  slashItems?: SlashItem[];
  placeholder?: string;
  className?: string;
  chipClassName?: string;
  skillChipClassName?: string;
  onEnterSubmit?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  renderItem?: (item: TItem, isSelected: boolean) => ReactNode;
  renderSlashItem?: (item: SlashItem, isSelected: boolean) => ReactNode;
  filterSlashItem?: (item: SlashItem, query: string) => boolean;
  filterItem?: (item: TItem, query: string) => boolean;
  emptySlashContent?: ReactNode;
  maxItems?: number;
  dataSlot?: string;
  ariaLabel?: string;
  ref?: Ref<MentionEditorHandle>;
}

interface TriggerState {
  isOpen: boolean;
  query: string;
  startIndex: number;
  kind: "mention" | "slash";
}

const CLOSED_TRIGGER: TriggerState = {
  isOpen: false,
  query: "",
  startIndex: 0,
  kind: "mention",
};

function previewOneLine(text: string, maxLength = 72): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1)}…`;
}

function renderMenuItemRow(
  prefix: string,
  label: string,
  detail: string | null,
  isSelected: boolean,
): ReactNode {
  return (
    <span className="flex min-w-0 w-full items-center gap-2">
      <span className="shrink-0">
        {prefix}
        {label}
      </span>
      {detail ? (
        <span
          className={
            "min-w-0 flex-1 truncate text-xs " +
            (isSelected ? "text-accent-foreground/60" : "text-muted-foreground")
          }
        >
          {detail}
        </span>
      ) : null}
    </span>
  );
}

function defaultRenderItem(item: MentionItem, isSelected: boolean): ReactNode {
  const detail = item.description ? previewOneLine(item.description) : null;
  return renderMenuItemRow("@", item.label, detail, isSelected);
}

function defaultRenderSlashItem(
  item: SlashItem,
  isSelected: boolean,
): ReactNode {
  const detail = item.prompt ? previewOneLine(item.prompt) : null;
  return renderMenuItemRow("/", item.label, detail, isSelected);
}

function defaultFilterSlashItem(item: SlashItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.prompt?.toLowerCase().includes(q)) return true;
  return false;
}

function defaultFilter(item: MentionItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.description?.toLowerCase().includes(q)) return true;
  return false;
}

function isValidTrigger(value: string, triggerIndex: number): boolean {
  const textAfter = value.slice(triggerIndex + 1);
  if (textAfter.includes("\n") || /\s/.test(textAfter)) {
    return false;
  }
  const charBefore = triggerIndex > 0 ? value[triggerIndex - 1] : "";
  return (
    triggerIndex === 0 || (charBefore !== undefined && /\s/.test(charBefore))
  );
}

function findActiveTrigger(
  value: string,
  hasMentions: boolean,
  hasSlash: boolean,
): TriggerState | null {
  const candidates: Array<{
    kind: "mention" | "slash";
    index: number;
  }> = [];

  if (hasMentions) {
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1 && isValidTrigger(value, atIndex)) {
      candidates.push({ kind: "mention", index: atIndex });
    }
  }

  if (hasSlash) {
    const slashIndex = value.lastIndexOf("/");
    if (slashIndex !== -1 && isValidTrigger(value, slashIndex)) {
      candidates.push({ kind: "slash", index: slashIndex });
    }
  }

  if (candidates.length === 0) return null;

  const active = candidates.reduce((best, candidate) =>
    candidate.index >= best.index ? candidate : best,
  );

  return {
    isOpen: true,
    query: value.slice(active.index + 1),
    startIndex: active.index,
    kind: active.kind,
  };
}

export function MentionEditor<TItem extends MentionItem = MentionItem>({
  ref,
  value,
  onValueChange,
  items,
  slashItems = [],
  placeholder,
  className,
  chipClassName = DEFAULT_CHIP_CLASS,
  skillChipClassName = DEFAULT_SKILL_CHIP_CLASS,
  onEnterSubmit,
  renderItem = defaultRenderItem,
  renderSlashItem = defaultRenderSlashItem,
  filterItem = defaultFilter,
  filterSlashItem = defaultFilterSlashItem,
  emptySlashContent,
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
  const [skillMap, setSkillMap] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (value === "" && (mentionMap.size > 0 || skillMap.size > 0)) {
      setMentionMap(new Map());
      setSkillMap(new Map());
    }
  }, [value, mentionMap.size, skillMap.size]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (normalizeMentionText(extractEditableText(el)) !== value) {
      el.innerHTML = renderEditorChipHtml(
        value,
        mentionMap.keys(),
        skillMap.keys(),
        chipClassName,
        skillChipClassName,
      );
      placeCursorAtEnd(el);
    }
  }, [value, mentionMap, skillMap, chipClassName, skillChipClassName]);

  useImperativeHandle(
    ref,
    () => ({
      tokenize: (text: string) => {
        let result = text;
        if (mentionMap.size > 0) {
          const pattern = buildMentionPattern([...mentionMap.keys()]);
          result = result.replace(pattern, (match) => {
            const label = match.slice(1);
            const id = mentionMap.get(label);
            return id ? formatMentionToken(label, id) : match;
          });
        }
        if (skillMap.size > 0) {
          const pattern = buildSkillPattern([...skillMap.keys()]);
          result = result.replace(pattern, (match) => {
            const label = match.slice(1);
            const id = skillMap.get(label);
            return id ? formatSkillToken(label, id) : match;
          });
        }
        return result;
      },
      reset: () => {
        setMentionMap(new Map());
        setSkillMap(new Map());
      },
      focus: () => editorRef.current?.focus(),
    }),
    [mentionMap, skillMap],
  );

  const activeSlashItems = slashItems
    .filter((item) => filterSlashItem(item, trigger.query))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, maxItems);

  const activeMentionItems = items
    .filter((item) => filterItem(item, trigger.query))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, maxItems);

  const popupItems =
    trigger.kind === "slash" ? activeSlashItems : activeMentionItems;

  const closeTrigger = useCallback(() => {
    setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
    setSelectedIndex(0);
  }, []);

  const insertMentionItem = useCallback(
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

  const insertSlashItem = useCallback(
    (item: SlashItem) => {
      const visible = `/${item.label}`;
      const before = value.slice(0, trigger.startIndex);
      const after = value.slice(trigger.startIndex + trigger.query.length + 1);
      const newValue = before + visible + " " + after;
      setSkillMap((prev) => {
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

  const insertActiveItem = useCallback(() => {
    if (trigger.kind === "slash") {
      const item = activeSlashItems[selectedIndex];
      if (item) insertSlashItem(item);
      return;
    }
    const item = activeMentionItems[selectedIndex];
    if (item) insertMentionItem(item);
  }, [
    trigger.kind,
    activeSlashItems,
    activeMentionItems,
    selectedIndex,
    insertSlashItem,
    insertMentionItem,
  ]);

  useEffect(() => {
    const next = findActiveTrigger(
      value,
      items.length > 0,
      slashItems.length > 0 || emptySlashContent !== undefined,
    );
    if (!next) {
      setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
      return;
    }
    setTrigger(next);
    setSelectedIndex(0);
  }, [value, items.length, slashItems.length, emptySlashContent]);

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
      const showEmptySlash =
        trigger.isOpen &&
        trigger.kind === "slash" &&
        popupItems.length === 0 &&
        emptySlashContent !== undefined;

      if (trigger.isOpen && (popupItems.length > 0 || showEmptySlash)) {
        if (popupItems.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev >= popupItems.length - 1 ? 0 : prev + 1,
            );
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev <= 0 ? popupItems.length - 1 : prev - 1,
            );
            return;
          }
          if (e.key === "Enter") {
            if (isComposing || e.nativeEvent.isComposing) return;
            e.preventDefault();
            e.stopPropagation();
            insertActiveItem();
            return;
          }
          if (e.key === "Tab") {
            e.preventDefault();
            insertActiveItem();
            return;
          }
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
      trigger.kind,
      popupItems.length,
      emptySlashContent,
      insertActiveItem,
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

  const isEmpty = value === "" || value === "\n";

  const showPopup =
    trigger.isOpen &&
    (popupItems.length > 0 ||
      (trigger.kind === "slash" && emptySlashContent !== undefined));

  const popup = showPopup ? (
    <div
      className="fixed z-50 overflow-hidden rounded-md bg-popover py-1 text-popover-foreground shadow-md"
      style={{
        left: position.left,
        top: position.top - 8,
        width: position.width,
        transform: "translateY(-100%)",
      }}
    >
      {popupItems.length > 0 ? (
        popupItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              if (trigger.kind === "slash") {
                insertSlashItem(item);
              } else {
                insertMentionItem(item as TItem);
              }
            }}
            className={
              "flex w-full min-w-0 items-center px-3 py-1.5 text-left text-sm " +
              (index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground")
            }
          >
            {trigger.kind === "slash"
              ? renderSlashItem(item, index === selectedIndex)
              : renderItem(item as TItem, index === selectedIndex)}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {emptySlashContent}
        </div>
      )}
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
