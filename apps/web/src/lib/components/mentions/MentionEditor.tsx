"use client";

import {
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
  isEditorValueEmpty,
  normalizeMentionText,
  placeCursorAtEnd,
  renderEditorChipHtml,
} from "./mentionEditorUtils";
import { MENTION_CHIP_CLASS, SKILL_CHIP_CLASS } from "./mentionChipStyles";
import { countLinkUrls } from "./linkChipUtils";
import { MentionPickerPopup } from "./MentionPickerPopup";
import {
  computeMentionPopupPlacement,
  getSelectionAnchorRect,
  type MentionPopupPlacement,
} from "./mentionPopupPosition";
import { UserInitials, UserProfileHoverCardBody } from "@eva/shared";
import type { Id } from "@eva/backend";

// The inline AI suggestion renders as an `::after` pseudo-element fed by
// `data-suggestion`, mirroring how the placeholder uses `::before`. A pseudo-
// element is invisible to `extractEditableText` and to the caret, so ghost text
// never leaks into the editor value or the DOM-resync effect below.
const DEFAULT_EDITOR_CLASS =
  "relative block w-full whitespace-pre-wrap wrap-break-word bg-transparent text-sm outline-hidden data-empty:before:pointer-events-none data-empty:before:select-none data-empty:before:absolute data-empty:before:text-muted-foreground/90 data-empty:before:content-[attr(data-placeholder)] data-suggestion:after:pointer-events-none data-suggestion:after:select-none data-suggestion:after:text-muted-foreground/50 data-suggestion:after:content-[attr(data-suggestion)]";

export interface MentionItem<TId extends string = string> {
  id: TId;
  label: string;
  description?: string;
  /** Type badge shown in the picker (e.g. Document, Session, Person). */
  badge?: string;
  /**
   * Set when this item is a teammate rather than a data entity, so the picker
   * row shows their avatar. Same value as `id` for people items; kept separate
   * so the renderer can tell the two kinds apart without re-deriving it.
   */
  personUserId?: Id<"users">;
}

export interface SlashItem<
  TId extends string = string,
> extends MentionItem<TId> {}

export interface MentionEditorHandle {
  tokenize: (text: string) => string;
  reset: () => void;
  focus: () => void;
  /** Append an @mention chip (and trailing space) to the current draft. */
  insertMention: (item: MentionItem) => void;
  /** Append a /skill chip (and trailing space) to the current draft. */
  insertSkill: (item: SlashItem) => void;
  /**
   * Merge label→id maps from restored tokenized content (e.g. prompt stash)
   * without wiping chips already in the live draft.
   */
  addTokenMaps: (
    mentions: Map<string, string>,
    skills: Map<string, string>,
  ) => void;
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
   * Called for large plain-text pastes. Return true when the paste was handled
   * (e.g. attached as a file) so the editor skips inline insert.
   */
  onLargeTextPaste?: (text: string) => boolean;
  /**
   * Called on Alt+ArrowUp / Alt+ArrowDown while the mention popup is closed.
   * Return true if the navigation was handled (e.g. a history entry was
   * applied) to suppress the browser default.
   */
  onHistoryNavigate?: (direction: "up" | "down") => boolean;
  /**
   * Inline AI completion shown as dim ghost text after the caret. Tab accepts it
   * (via `onAcceptSuggestion`), Escape dismisses it. Only rendered when the
   * mention/skill picker is closed, which keeps Tab's existing meaning intact.
   */
  suggestion?: string;
  /** Called on Tab while a suggestion is showing. */
  onAcceptSuggestion?: () => void;
  /** Called on Escape while a suggestion is showing. */
  onDismissSuggestion?: () => void;
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
  badge?: string,
): ReactNode {
  return (
    <span className="flex min-w-0 w-full flex-col gap-0.5 overflow-hidden">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
          <span className="shrink-0 text-muted-foreground">{prefix}</span>
          <span className="truncate">{label}</span>
        </span>
        {badge ? (
          <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </span>
      {detail ? (
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </span>
  );
}

function defaultRenderItem(item: MentionItem, _isSelected: boolean): ReactNode {
  // People read better as an avatar + name than as an `@`-prefixed slug, and the
  // name is PII so it carries `data-pii` for screenshot redaction.
  if (item.personUserId !== undefined) {
    return (
      <span className="flex w-full min-w-0 items-center gap-2">
        <UserInitials userId={item.personUserId} size="sm" hideLastSeen />
        <span data-pii className="min-w-0 flex-1 truncate">
          {item.label}
        </span>
        {item.badge ? (
          <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            {item.badge}
          </span>
        ) : null}
      </span>
    );
  }
  const detail = item.description ? previewOneLine(item.description) : null;
  return renderMenuItemRow("@", item.label, detail, item.badge);
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
  suggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  onImageFiles,
  onLargeTextPaste,
  renderItem = defaultRenderItem,
  renderSlashItem = defaultRenderSlashItem,
  filterItem = defaultFilter,
  filterSlashItem = defaultFilterSlashItem,
  emptySlashContent,
  mentionPopupTitle = "Data",
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

  const cancelChipHoverClose = () => {
    if (mentionHoverCloseTimerRef.current !== null) {
      clearTimeout(mentionHoverCloseTimerRef.current);
      mentionHoverCloseTimerRef.current = null;
    }
  };

  const clearChipHoverCard = () => {
    cancelChipHoverClose();
    if (mentionHoverOpenTimerRef.current !== null) {
      clearTimeout(mentionHoverOpenTimerRef.current);
      mentionHoverOpenTimerRef.current = null;
    }
    mentionHoverChipRef.current = null;
    setMentionHover(null);
    setContentChipHover(null);
    setMentionHoverRect(null);
  };

  const scheduleChipHoverClose = () => {
    cancelChipHoverClose();
    mentionHoverCloseTimerRef.current = setTimeout(() => {
      mentionHoverCloseTimerRef.current = null;
      clearChipHoverCard();
    }, 200);
  };

  const scheduleMentionHoverCard = (chip: HTMLElement) => {
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
  };

  const scheduleContentChipHoverCard = (
    chip: HTMLElement,
    kind: "mention" | "skill",
  ) => {
    cancelChipHoverClose();
    if (mentionHoverChipRef.current === chip) return;
    mentionHoverChipRef.current = chip;
    if (mentionHoverOpenTimerRef.current !== null) {
      clearTimeout(mentionHoverOpenTimerRef.current);
    }
    const label =
      kind === "mention" ? chip.dataset.mentionLabel : chip.dataset.skillLabel;
    if (!label) return;
    const id = kind === "mention" ? mentionMap.get(label) : skillMap.get(label);
    if (id === undefined) return;
    mentionHoverOpenTimerRef.current = setTimeout(() => {
      mentionHoverOpenTimerRef.current = null;
      setMentionHover(null);
      setContentChipHover({ kind, id });
      setMentionHoverRect(chip.getBoundingClientRect());
    }, 250);
  };

  useEffect(() => {
    if (value === "" && (mentionMap.size > 0 || skillMap.size > 0)) {
      setMentionMap(new Map());
      setSkillMap(new Map());
    }
  }, [value, mentionMap.size, skillMap.size]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const domText = normalizeMentionText(extractEditableText(el));
    // A pasted/typed link URL leaves DOM text already equal to `value`, so also
    // re-render when the link-chip count is out of sync — this chips a fresh URL
    // exactly once, then stays stable during normal editing.
    const linkChipCount = el.querySelectorAll("[data-link-url]").length;
    if (domText !== value || linkChipCount !== countLinkUrls(value)) {
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

  const appendToken = (
    prefix: "@" | "/",
    item: MentionItem,
    kind: "mention" | "skill",
  ) => {
    const visible = `${prefix}${item.label}`;
    const needsSpace = value.length > 0 && !/\s$/.test(value);
    const newValue = `${value}${needsSpace ? " " : ""}${visible} `;
    if (kind === "mention") {
      setMentionMap((prev) => {
        const next = new Map(prev);
        next.set(item.label, item.id);
        return next;
      });
    } else {
      setSkillMap((prev) => {
        const next = new Map(prev);
        next.set(item.label, item.id);
        return next;
      });
    }
    onValueChange(newValue);
    requestAnimationFrame(() => editorRef.current?.focus());
  };

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
      insertMention: (item: MentionItem) => appendToken("@", item, "mention"),
      insertSkill: (item: SlashItem) => appendToken("/", item, "skill"),
      addTokenMaps: (mentions, skills) => {
        setMentionMap((prev) => new Map([...prev, ...mentions]));
        setSkillMap((prev) => new Map([...prev, ...skills]));
      },
    }),
    [mentionMap, skillMap, value, onValueChange],
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

  const closeTrigger = () => {
    setTrigger((prev) => (prev.isOpen ? CLOSED_TRIGGER : prev));
    setSelectedIndex(0);
  };

  const insertMentionItem = (item: TItem) => {
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
  };

  const insertSlashItem = (item: SlashItem) => {
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
  };

  const insertActiveItem = () => {
    if (trigger.kind === "slash") {
      const item = activeSlashItems[selectedIndex];
      if (item) insertSlashItem(item);
      return;
    }
    const item = activeMentionItems[selectedIndex];
    if (item) insertMentionItem(item);
  };

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

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const text = normalizeMentionText(extractEditableText(el));
    if (text !== value) {
      onValueChange(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
          if (e.nativeEvent.isComposing) return;
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

    // Inline AI completion. Sits after the picker block so the picker keeps
    // priority on Tab, and before history recall so Escape reaches it.
    if (suggestion && !trigger.isOpen) {
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        onAcceptSuggestion?.();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onDismissSuggestion?.();
        return;
      }
    }

    // Message-history recall: Alt+Up/Down so plain arrows stay for caret
    // movement in multi-line drafts. Skip when the mention picker is open.
    if (
      onHistoryNavigate &&
      !trigger.isOpen &&
      e.altKey &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      if (e.key === "ArrowUp") {
        if (onHistoryNavigate("up")) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === "ArrowDown") {
        if (onHistoryNavigate("down")) {
          e.preventDefault();
          return;
        }
      }
    }

    if (e.key === "Enter" && onEnterSubmit) {
      if (e.nativeEvent.isComposing) return;
      if (e.shiftKey) return;
      e.preventDefault();
      onEnterSubmit(e);
    }
  };

  const handleBlur = () => {
    if (trigger.isOpen) closeTrigger();
    if (chipHoverEnabled) clearChipHoverCard();
    onBlur?.();
  };

  const handleEditorMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

  const handleEditorMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

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

  const handleChipClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    // Link chips open externally and are always clickable, independent of the
    // mention/skill click handlers.
    const linkChip = target.closest("[data-link-url]");
    if (linkChip instanceof HTMLElement) {
      const url = linkChip.dataset.linkUrl;
      if (url) {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return;
    }

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
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
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
    const plainText = e.clipboardData.getData("text/plain");
    if (onLargeTextPaste && onLargeTextPaste(plainText)) {
      e.preventDefault();
      return;
    }
    // Keep plain-text-only paste (strip HTML), but join the browser undo stack.
    // Manual range.insertNode bypasses undo, so Ctrl+Z undid prior typing
    // instead of the paste.
    e.preventDefault();
    if (plainText.length === 0) return;
    if (document.execCommand("insertText", false, plainText)) {
      handleInput();
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(plainText));
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    handleInput();
  };

  const isEmpty = isEditorValueEmpty(value);

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
          query={trigger.query}
          onRefocusEditor={() => editorRef.current?.focus()}
        />
      ) : (
        <MentionPickerPopup
          title={popupTitle}
          placement={popupPlacement}
          items={activeMentionItems}
          selectedIndex={selectedIndex}
          renderItem={renderItem}
          onSelectItem={insertMentionItem}
          query={trigger.query}
          onRefocusEditor={() => editorRef.current?.focus()}
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
        data-suggestion={suggestion}
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
        onClick={disabled ? undefined : handleChipClick}
        onMouseOver={chipHoverEnabled ? handleEditorMouseOver : undefined}
        onMouseOut={chipHoverEnabled ? handleEditorMouseOut : undefined}
        onBlur={disabled ? undefined : handleBlur}
        onPaste={disabled ? undefined : handlePaste}
      />
      {pickerPopup && typeof document !== "undefined"
        ? createPortal(pickerPopup, document.body)
        : null}
      {chipHoverCard}
    </>
  );
}
