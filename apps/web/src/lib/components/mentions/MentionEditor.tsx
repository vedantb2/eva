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
  isCaretOnFirstLine,
  isCaretOnLastLine,
  normalizeMentionText,
  placeCursorAtEnd,
  renderEditorChipHtml,
} from "./mentionEditorUtils";
import { MENTION_CHIP_CLASS, SKILL_CHIP_CLASS } from "./mentionChipStyles";
import { MentionPickerPopup } from "./MentionPickerPopup";
import {
  computeMentionPopupPlacement,
  getSelectionAnchorRect,
  type MentionPopupPlacement,
} from "./mentionPopupPosition";
import { UserProfileHoverCardBody } from "@conductor/shared";

const DEFAULT_EDITOR_CLASS =
  "relative block w-full whitespace-pre-wrap break-words bg-transparent text-sm outline-none data-[empty]:before:pointer-events-none data-[empty]:before:select-none data-[empty]:before:absolute data-[empty]:before:text-muted-foreground/90 data-[empty]:before:content-[attr(data-placeholder)]";

export interface MentionItem<TId extends string = string> {
  id: TId;
  label: string;
  description?: string;
}

export interface SlashItem<
  TId extends string = string,
> extends MentionItem<TId> {}

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
  /**
   * Called when image files are pasted into the editor. When provided, pasted
   * images are handed off here (as attachments) instead of being inserted as
   * text; non-image clipboard content still pastes as plain text.
   */
  onImageFiles?: (files: File[]) => void;
  /**
   * Called when ArrowUp is pressed on the first line, or ArrowDown on the last
   * line, while the mention popup is closed. Return true if the navigation was
   * handled (e.g. a history entry was applied) to suppress caret movement.
   */
  onHistoryNavigate?: (direction: "up" | "down") => boolean;
  renderItem?: (item: TItem, isSelected: boolean) => ReactNode;
  renderSlashItem?: (item: SlashItem, isSelected: boolean) => ReactNode;
  filterSlashItem?: (item: SlashItem, query: string) => boolean;
  filterItem?: (item: TItem, query: string) => boolean;
  emptySlashContent?: ReactNode;
  mentionPopupTitle?: string;
  onMentionChipClick?: (id: string) => void;
  onSkillChipClick?: (id: string) => void;
  /** Profile hover card on @mention chips in the editor (e.g. comment @people). */
  mentionChipHoverCard?: boolean;
  /** Doc/PRD preview on @mention chips (e.g. task description). */
  renderMentionChipHoverCard?: (id: string) => ReactNode;
  /** Skill preview on /skill chips. */
  renderSkillChipHoverCard?: (id: string) => ReactNode;
  dataSlot?: string;
  ariaLabel?: string;
  onBlur?: () => void;
  /** When true, sets contentEditable to false and blocks all input. */
  disabled?: boolean;
  ref?: Ref<MentionEditorHandle>;
  /**
   * Seed the editor's mention label→id map on first render. Obtain from
   * `tokenizedToEditable` when restoring persisted tokenized content.
   * Initializer-only — changes after mount are ignored.
   */
  initialMentionMap?: Map<string, string>;
  /**
   * Seed the editor's skill label→id map on first render. Obtain from
   * `tokenizedToEditable` when restoring persisted tokenized content.
   * Initializer-only — changes after mount are ignored.
   */
  initialSkillMap?: Map<string, string>;
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
): ReactNode {
  return (
    <span className="flex min-w-0 w-full flex-col gap-0.5 overflow-hidden">
      <span className="flex min-w-0 items-center gap-0.5">
        <span className="shrink-0 text-muted-foreground">{prefix}</span>
        <span className="truncate">{label}</span>
      </span>
      {detail ? (
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </span>
  );
}

function defaultRenderItem(item: MentionItem, _isSelected: boolean): ReactNode {
  const detail = item.description ? previewOneLine(item.description) : null;
  return renderMenuItemRow("@", item.label, detail);
}

function defaultRenderSlashItem(
  item: SlashItem,
  _isSelected: boolean,
): ReactNode {
  const detail = item.description ? previewOneLine(item.description) : null;
  return renderMenuItemRow("/", item.label, detail);
}

function defaultFilterSlashItem(item: SlashItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.description?.toLowerCase().includes(q)) return true;
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
  chipClassName = MENTION_CHIP_CLASS,
  skillChipClassName = SKILL_CHIP_CLASS,
  onEnterSubmit,
  onHistoryNavigate,
  onImageFiles,
  renderItem = defaultRenderItem,
  renderSlashItem = defaultRenderSlashItem,
  filterItem = defaultFilter,
  filterSlashItem = defaultFilterSlashItem,
  emptySlashContent,
  mentionPopupTitle = "Docs",
  onMentionChipClick,
  onSkillChipClick,
  mentionChipHoverCard = false,
  renderMentionChipHoverCard,
  renderSkillChipHoverCard,
  dataSlot,
  ariaLabel,
  onBlur,
  disabled = false,
  initialMentionMap,
  initialSkillMap,
}: MentionEditorProps<TItem>) {
  const chipsClickable =
    onMentionChipClick !== undefined || onSkillChipClick !== undefined;
  const chipHoverEnabled =
    mentionChipHoverCard ||
    renderMentionChipHoverCard !== undefined ||
    renderSkillChipHoverCard !== undefined;
  const editorRef = useRef<HTMLDivElement>(null);
  const [trigger, setTrigger] = useState<TriggerState>(CLOSED_TRIGGER);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPlacement, setPopupPlacement] =
    useState<MentionPopupPlacement | null>(null);
  const [mentionMap, setMentionMap] = useState<Map<string, string>>(() =>
    initialMentionMap ? new Map(initialMentionMap) : new Map(),
  );
  const [skillMap, setSkillMap] = useState<Map<string, string>>(() =>
    initialSkillMap ? new Map(initialSkillMap) : new Map(),
  );
  const [isComposing, setIsComposing] = useState(false);
  const [mentionHover, setMentionHover] = useState<{
    userId: string;
  } | null>(null);
  const [contentChipHover, setContentChipHover] = useState<{
    kind: "mention" | "skill";
    id: string;
  } | null>(null);
  const [mentionHoverRect, setMentionHoverRect] = useState<DOMRect | null>(
    null,
  );
  const mentionHoverChipRef = useRef<HTMLElement | null>(null);
  const mentionHoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mentionHoverCloseTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const cancelChipHoverClose = useCallback(() => {
    if (mentionHoverCloseTimerRef.current !== null) {
      clearTimeout(mentionHoverCloseTimerRef.current);
      mentionHoverCloseTimerRef.current = null;
    }
  }, []);

  const clearChipHoverCard = useCallback(() => {
    cancelChipHoverClose();
    if (mentionHoverOpenTimerRef.current !== null) {
      clearTimeout(mentionHoverOpenTimerRef.current);
      mentionHoverOpenTimerRef.current = null;
    }
    mentionHoverChipRef.current = null;
    setMentionHover(null);
    setContentChipHover(null);
    setMentionHoverRect(null);
  }, [cancelChipHoverClose]);

  const scheduleChipHoverClose = useCallback(() => {
    cancelChipHoverClose();
    mentionHoverCloseTimerRef.current = setTimeout(() => {
      mentionHoverCloseTimerRef.current = null;
      clearChipHoverCard();
    }, 200);
  }, [cancelChipHoverClose, clearChipHoverCard]);

  const scheduleMentionHoverCard = useCallback(
    (chip: HTMLElement) => {
      cancelChipHoverClose();
      if (mentionHoverChipRef.current === chip) return;
      mentionHoverChipRef.current = chip;
      if (mentionHoverOpenTimerRef.current !== null) {
        clearTimeout(mentionHoverOpenTimerRef.current);
      }
      const label = chip.dataset.mentionLabel;
      if (!label) return;
      const id = mentionMap.get(label);
      if (id === undefined) return;
      mentionHoverOpenTimerRef.current = setTimeout(() => {
        mentionHoverOpenTimerRef.current = null;
        setContentChipHover(null);
        setMentionHover({ userId: id });
        setMentionHoverRect(chip.getBoundingClientRect());
      }, 250);
    },
    [cancelChipHoverClose, mentionMap],
  );

  const scheduleContentChipHoverCard = useCallback(
    (chip: HTMLElement, kind: "mention" | "skill") => {
      cancelChipHoverClose();
      if (mentionHoverChipRef.current === chip) return;
      mentionHoverChipRef.current = chip;
      if (mentionHoverOpenTimerRef.current !== null) {
        clearTimeout(mentionHoverOpenTimerRef.current);
      }
      const label =
        kind === "mention"
          ? chip.dataset.mentionLabel
          : chip.dataset.skillLabel;
      if (!label) return;
      const id =
        kind === "mention" ? mentionMap.get(label) : skillMap.get(label);
      if (id === undefined) return;
      mentionHoverOpenTimerRef.current = setTimeout(() => {
        mentionHoverOpenTimerRef.current = null;
        setMentionHover(null);
        setContentChipHover({ kind, id });
        setMentionHoverRect(chip.getBoundingClientRect());
      }, 250);
    },
    [cancelChipHoverClose, mentionMap, skillMap],
  );

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
        mentionMap,
        skillMap,
        chipClassName,
        skillChipClassName,
        chipsClickable,
      );
      placeCursorAtEnd(el);
    }
  }, [
    value,
    mentionMap,
    skillMap,
    chipClassName,
    skillChipClassName,
    chipsClickable,
  ]);

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

  // Full filtered lists — popup scrolls; do not cap (callers need every
  // doc/skill/person available, not an alphabetical first-N subset).
  const activeSlashItems = slashItems
    .filter((item) => filterSlashItem(item, trigger.query))
    .sort((a, b) => a.label.localeCompare(b.label));

  const activeMentionItems = items
    .filter((item) => filterItem(item, trigger.query))
    .sort((a, b) => a.label.localeCompare(b.label));

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
    if (!trigger.isOpen) {
      setPopupPlacement(null);
      return;
    }
    const update = () => {
      requestAnimationFrame(() => {
        const el = editorRef.current;
        if (!el) return;
        const anchor = getSelectionAnchorRect(el);
        setPopupPlacement(computeMentionPopupPlacement(anchor));
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [trigger.isOpen, trigger.query, trigger.startIndex, value]);

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

      // Message-history recall: only when the popup is closed and no modifier
      // is held, so it never competes with the mention picker or shortcuts.
      if (
        onHistoryNavigate &&
        !trigger.isOpen &&
        !e.shiftKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        const el = editorRef.current;
        if (e.key === "ArrowUp" && el && isCaretOnFirstLine(el)) {
          if (onHistoryNavigate("up")) {
            e.preventDefault();
            return;
          }
        }
        if (e.key === "ArrowDown" && el && isCaretOnLastLine(el)) {
          if (onHistoryNavigate("down")) {
            e.preventDefault();
            return;
          }
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
      onHistoryNavigate,
    ],
  );

  const handleBlur = useCallback(() => {
    if (trigger.isOpen) closeTrigger();
    if (chipHoverEnabled) clearChipHoverCard();
    onBlur?.();
  }, [
    trigger.isOpen,
    closeTrigger,
    onBlur,
    chipHoverEnabled,
    clearChipHoverCard,
  ]);

  const handleEditorMouseOver = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chipHoverEnabled) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const mentionChip = target.closest("[data-mention-label]");
      if (mentionChip instanceof HTMLElement) {
        if (mentionChipHoverCard) {
          scheduleMentionHoverCard(mentionChip);
        } else if (renderMentionChipHoverCard) {
          scheduleContentChipHoverCard(mentionChip, "mention");
        }
        return;
      }
      const skillChip = target.closest("[data-skill-label]");
      if (
        skillChip instanceof HTMLElement &&
        renderSkillChipHoverCard !== undefined
      ) {
        scheduleContentChipHoverCard(skillChip, "skill");
      }
    },
    [
      chipHoverEnabled,
      mentionChipHoverCard,
      renderMentionChipHoverCard,
      renderSkillChipHoverCard,
      scheduleMentionHoverCard,
      scheduleContentChipHoverCard,
    ],
  );

  const handleEditorMouseOut = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chipHoverEnabled) return;
      const related = e.relatedTarget;
      if (related instanceof Element) {
        if (
          related.closest("[data-mention-label]") !== null ||
          related.closest("[data-skill-label]") !== null ||
          related.closest("[data-mention-hover-card]") !== null
        ) {
          return;
        }
      }
      scheduleChipHoverClose();
    },
    [chipHoverEnabled, scheduleChipHoverClose],
  );

  useEffect(() => {
    if ((!mentionHover && !contentChipHover) || !mentionHoverRect) return;
    const updateRect = () => {
      const chip = mentionHoverChipRef.current;
      if (chip) {
        setMentionHoverRect(chip.getBoundingClientRect());
      }
    };
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [mentionHover, contentChipHover, mentionHoverRect]);

  useEffect(() => {
    return () => {
      if (mentionHoverOpenTimerRef.current !== null) {
        clearTimeout(mentionHoverOpenTimerRef.current);
      }
      if (mentionHoverCloseTimerRef.current !== null) {
        clearTimeout(mentionHoverCloseTimerRef.current);
      }
    };
  }, []);

  const handleChipClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const mentionChip = target.closest("[data-mention-label]");
      if (mentionChip instanceof HTMLElement && onMentionChipClick) {
        const label = mentionChip.dataset.mentionLabel;
        if (label) {
          const id = mentionMap.get(label);
          if (id !== undefined) {
            e.preventDefault();
            e.stopPropagation();
            onMentionChipClick(id);
          }
        }
        return;
      }

      const skillChip = target.closest("[data-skill-label]");
      if (skillChip instanceof HTMLElement && onSkillChipClick) {
        const label = skillChip.dataset.skillLabel;
        if (label) {
          const id = skillMap.get(label);
          if (id !== undefined) {
            e.preventDefault();
            e.stopPropagation();
            onSkillChipClick(id);
          }
        }
      }
    },
    [mentionMap, skillMap, onMentionChipClick, onSkillChipClick],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      // Hand pasted image files to the attachment handler instead of inserting
      // them as text. Only images are intercepted; other files fall through.
      if (onImageFiles) {
        const imageFiles: File[] = [];
        for (const item of e.clipboardData.items) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          e.preventDefault();
          onImageFiles(imageFiles);
          return;
        }
      }
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
    [handleInput, onImageFiles],
  );

  const isEmpty = value === "" || value === "\n";

  const showPopup =
    trigger.isOpen &&
    (popupItems.length > 0 ||
      (trigger.kind === "slash" && emptySlashContent !== undefined));

  const popupTitle = trigger.kind === "slash" ? "Skills" : mentionPopupTitle;

  const pickerPopup =
    showPopup && popupPlacement ? (
      trigger.kind === "slash" ? (
        <MentionPickerPopup
          title={popupTitle}
          placement={popupPlacement}
          items={activeSlashItems}
          selectedIndex={selectedIndex}
          renderItem={renderSlashItem}
          onSelectItem={insertSlashItem}
          emptyContent={emptySlashContent}
        />
      ) : (
        <MentionPickerPopup
          title={popupTitle}
          placement={popupPlacement}
          items={activeMentionItems}
          selectedIndex={selectedIndex}
          renderItem={renderItem}
          onSelectItem={insertMentionItem}
        />
      )
    ) : null;

  const chipHoverCardContent =
    mentionHover && mentionChipHoverCard ? (
      <UserProfileHoverCardBody userId={mentionHover.userId} />
    ) : contentChipHover?.kind === "mention" &&
      renderMentionChipHoverCard !== undefined ? (
      renderMentionChipHoverCard(contentChipHover.id)
    ) : contentChipHover?.kind === "skill" &&
      renderSkillChipHoverCard !== undefined ? (
      renderSkillChipHoverCard(contentChipHover.id)
    ) : null;

  const chipHoverCard =
    chipHoverCardContent && mentionHoverRect && typeof document !== "undefined"
      ? createPortal(
          <div
            data-mention-hover-card="true"
            className="fixed z-50 flex w-72 flex-col-reverse items-stretch"
            style={{
              left: mentionHoverRect.left,
              bottom: window.innerHeight - mentionHoverRect.top,
            }}
            onMouseEnter={cancelChipHoverClose}
            onMouseLeave={scheduleChipHoverClose}
          >
            <div className="h-3 shrink-0" aria-hidden />
            {chipHoverCardContent}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={editorRef}
        data-slot={dataSlot}
        data-placeholder={placeholder ?? ""}
        data-empty={isEmpty ? "true" : undefined}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-disabled={disabled ? "true" : undefined}
        aria-label={ariaLabel ?? placeholder ?? "Editor"}
        className={
          className
            ? `${DEFAULT_EDITOR_CLASS} ${className}`
            : DEFAULT_EDITOR_CLASS
        }
        onInput={disabled ? undefined : handleInput}
        onKeyDown={disabled ? undefined : handleKeyDown}
        onClick={
          disabled ? undefined : chipsClickable ? handleChipClick : undefined
        }
        onMouseOver={chipHoverEnabled ? handleEditorMouseOver : undefined}
        onMouseOut={chipHoverEnabled ? handleEditorMouseOut : undefined}
        onBlur={disabled ? undefined : handleBlur}
        onPaste={disabled ? undefined : handlePaste}
        onCompositionStart={disabled ? undefined : () => setIsComposing(true)}
        onCompositionEnd={disabled ? undefined : () => setIsComposing(false)}
      />
      {pickerPopup && typeof document !== "undefined"
        ? createPortal(pickerPopup, document.body)
        : null}
      {chipHoverCard}
    </>
  );
}
