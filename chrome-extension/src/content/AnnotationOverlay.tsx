import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { IconTrash, IconX, IconDeviceFloppy, IconCheckbox, IconChevronRight } from "@tabler/icons-react";
import {
  extractReactTree,
  isReactAvailable,
  generateSelector,
  countComponents,
  detectReactVersion,
} from "./react-extractor";
import type { ExtractedContext } from "@/shared/types";
import type { StoredPin } from "@/shared/messaging";
import { subscribeDark, getDark } from "./theme";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import hljsCss from "highlight.js/styles/github-dark.min.css?inline";

hljs.registerLanguage("xml", xml);

interface ExtState {
  active: boolean;
  remotePins: Record<string, StoredPin> | null;
  currentPins: Record<string, StoredPin>;
  pinsHidden: boolean;
  version: number;
}

let _ext: ExtState = { active: false, remotePins: null, currentPins: {}, pinsHidden: false, version: 0 };
const _subs = new Set<() => void>();
function _emit() {
  _subs.forEach((s) => s());
}

export function activateAnnotation() {
  _ext = { ..._ext, active: true, version: _ext.version + 1 };
  _emit();
}

export function deactivateAnnotation() {
  _ext = { ..._ext, active: false, version: _ext.version + 1 };
  _emit();
}

export function setAnnotationsFromRemote(stored: Record<string, StoredPin>) {
  _ext = { ..._ext, remotePins: stored, currentPins: stored, version: _ext.version + 1 };
  _emit();
}

export function updateCurrentPins(pins: Record<string, StoredPin>) {
  _ext = { ..._ext, currentPins: pins, version: _ext.version + 1 };
  _emit();
}

export function clearAllAnnotations() {
  _ext = { active: false, remotePins: {}, currentPins: {}, pinsHidden: false, version: _ext.version + 1 };
  _emit();
}

export function togglePinsHidden() {
  _ext = { ..._ext, pinsHidden: !_ext.pinsHidden, version: _ext.version + 1 };
  _emit();
}

export function getAnnotationState(): ExtState {
  return _ext;
}

export function subscribeAnnotation(cb: () => void) {
  _subs.add(cb);
  return () => { _subs.delete(cb); };
}

interface PinData {
  x: number;
  y: number;
  text: string;
  number: number;
  saved: boolean;
  type: "element" | "text";
  selectedText?: string;
}

function getPageUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function captureContext(element: HTMLElement): ExtractedContext {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const hasReact = isReactAvailable();
  const reactResult = hasReact ? extractReactTree(element) : null;
  return {
    element: {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      classNames: Array.from(element.classList),
      textContent: (element.textContent || "").slice(0, 500),
      attributes: Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
      ),
      boundingRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      computedStyles: {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
      },
      selector: generateSelector(element),
      innerHTML: element.innerHTML.slice(0, 1000),
      outerHTML: element.outerHTML.slice(0, 1000),
    },
    react: reactResult?.tree ?? null,
    metadata: {
      capturedAt: Date.now(),
      sourceUrl: window.location.href,
      hasReact,
      totalComponents: reactResult ? countComponents(reactResult.tree) : 0,
      reactVersion: hasReact ? detectReactVersion() : "N/A",
    },
  };
}


interface PinComponentProps {
  id: string;
  data: PinData;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
  onHover: (id: string) => void;
  onLeave: () => void;
}

function PinComponent({ id, data, onDragEnd, onClick, onHover, onLeave }: PinComponentProps) {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    dragging: boolean;
  } | null>(null);

  const x = dragPos ? dragPos.x : data.x;
  const y = dragPos ? dragPos.y : data.y;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      const el = e.currentTarget;
      dragRef.current = {
        startX: e.pageX,
        startY: e.pageY,
        offsetX: e.pageX - el.offsetLeft,
        offsetY: e.pageY - el.offsetTop,
        dragging: false,
      };

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        if (!d.dragging && Math.abs(ev.pageX - d.startX) + Math.abs(ev.pageY - d.startY) > 5) {
          d.dragging = true;
        }
        if (d.dragging) {
          setDragPos({ x: ev.pageX - d.offsetX + 12, y: ev.pageY - d.offsetY + 12 });
        }
      };

      const onUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup", onUp, true);
        const d = dragRef.current;
        dragRef.current = null;
        setDragPos(null);
        if (d?.dragging) {
          onDragEnd(id, ev.pageX - d.offsetX + 12, ev.pageY - d.offsetY + 12);
        } else if (data.saved) {
          onClick(id);
        }
      };

      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onUp, true);
    },
    [id, data.saved, onDragEnd, onClick],
  );

  return (
    <div
      className="absolute flex items-center justify-center rounded-full bg-[#975799] text-white font-semibold border-2 border-white cursor-pointer select-none"
      style={{
        left: x - 12,
        top: y - 12,
        width: 24,
        height: 24,
        fontSize: 11,
        zIndex: 2147483645,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transition: dragPos ? "none" : "transform 0.15s, box-shadow 0.15s",
        opacity: dragPos ? 0.8 : 1,
        pointerEvents: "auto",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => {
        if (data.saved) onHover(id);
      }}
      onMouseLeave={onLeave}
    >
      {data.saved ? data.number : "+"}
    </div>
  );
}

interface InputCardProps {
  pinId: string;
  position: { x: number; y: number };
  initialText: string;
  pinNumber: number;
  elementHtml: string;
  selectedText?: string;
  isEdit: boolean;
  onSave: (pinId: string, text: string) => void;
  onTask: (pinId: string, text: string) => void;
  onCancel: (pinId: string) => void;
  onDelete: (pinId: string) => void;
}

function InputCard({
  pinId,
  position,
  initialText,
  pinNumber,
  elementHtml,
  selectedText,
  isEdit,
  onSave,
  onTask,
  onCancel,
  onDelete,
}: InputCardProps) {
  const [text, setText] = useState(initialText);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dark = useSyncExternalStore(subscribeDark, getDark);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey && text.trim()) {
        e.preventDefault();
        onSave(pinId, text.trim());
      }
      if (e.key === "Escape") onCancel(pinId);
    },
    [text, pinId, onSave, onCancel],
  );

  return (
    <div
      className={`absolute rounded-xl border ${dark ? "bg-white border-neutral-200" : "bg-neutral-800 border-neutral-700"}`}
      style={{
        left: position.x - 12,
        top: position.y + 18,
        width: 340,
        zIndex: 2147483645,
        boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.12)" : "0 8px 32px rgba(0,0,0,0.4)",
        pointerEvents: "auto",
      }}
    >
      <div className={`flex items-center justify-between px-3 pt-3 pb-1.5 text-sm font-medium ${dark ? "text-neutral-500" : "text-neutral-400"}`}>
        <span>{isEdit ? `Annotation #${pinNumber}` : "New annotation"}</span>
        {isEdit && (
          <button
            onClick={() => onDelete(pinId)}
            className={`flex items-center gap-0.5 border-none cursor-pointer bg-transparent ${dark ? "text-red-500 hover:text-red-600" : "text-red-400 hover:text-red-300"}`}
            style={{ fontSize: 11 }}
          >
            <IconTrash size={12} /> Delete
          </button>
        )}
      </div>
      {selectedText ? (
        <div className="px-3 pb-1">
          <p className={`text-xs ${dark ? "text-neutral-500" : "text-neutral-400"}`} style={{ margin: 0 }}>Selected Text</p>
          <p className={`text-sm mt-1 italic ${dark ? "text-neutral-700" : "text-neutral-200"}`} style={{ margin: "4px 0 0" }}>
            &ldquo;{selectedText.length > 200 ? `${selectedText.slice(0, 200)}...` : selectedText}&rdquo;
          </p>
        </div>
      ) : elementHtml ? (
        <div className="px-3 pb-1">
          <button
            onClick={() => setDetailsOpen((v) => !v)}
            className={`flex items-center gap-1 w-full text-left border-none bg-transparent cursor-pointer text-xs ${dark ? "text-neutral-500 hover:text-neutral-600" : "text-neutral-400 hover:text-neutral-300"}`}
            style={{ padding: 0 }}
          >
            <IconChevronRight
              size={12}
              style={{ transition: "transform 0.15s", transform: detailsOpen ? "rotate(90deg)" : "none" }}
            />
            Element Details
          </button>
          {detailsOpen && (
            <>
              <style>{hljsCss}</style>
              <pre
                className="mt-1 rounded border p-0.5 overflow-auto bg-[#0d1117] border-neutral-700"
                style={{ fontFamily: "monospace", maxHeight: 120, margin: 0, marginTop: 4 }}
              >
                <code
                  className="hljs text-xs"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(elementHtml, { language: "xml" }).value,
                  }}
                />
              </pre>
            </>
          )}
        </div>
      ) : null}
      <div className="px-3 pb-2">
        <textarea
          ref={textareaRef}
          rows={3}
          placeholder="Describe the issue..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border px-2.5 py-2 text-sm leading-snug outline-none resize-none ${dark ? "bg-neutral-50 text-neutral-800 border-neutral-200 placeholder-neutral-400" : "bg-neutral-900 text-neutral-100 border-neutral-700 placeholder-neutral-500"}`}
          style={{ boxSizing: "border-box", display: "block" }}
        />
      </div>
      <div className={`flex items-center justify-between px-3 pb-3 border-t ${dark ? "border-neutral-100" : "border-neutral-700"}`} style={{ paddingTop: 10 }}>
        <button
          onClick={() => {
            if (text.trim()) onTask(pinId, text.trim());
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#7a3a7c] hover:bg-[#975799] border-none cursor-pointer transition-colors"
          style={{ borderRadius: 8 }}
        >
          <IconCheckbox size={14} /> Create Task
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onCancel(pinId)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm border-none cursor-pointer transition-colors ${dark ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
            style={{ borderRadius: 8 }}
          >
            <IconX size={14} /> Cancel
          </button>
          <button
            onClick={() => {
              if (text.trim()) onSave(pinId, text.trim());
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#975799] hover:bg-[#a76ba9] border-none cursor-pointer transition-colors"
            style={{ borderRadius: 8 }}
          >
            <IconDeviceFloppy size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function HighlightOverlay({ rect }: { rect: { top: number; left: number; width: number; height: number } }) {
  const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
  return (
    <>
      <div
        className="fixed pointer-events-none border-2 border-blue-500 bg-blue-500/[0.08]"
        style={{
          zIndex: 2147483647,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          transition: "all 0.05s ease",
          boxSizing: "border-box",
        }}
      >
        {corners.map((pos) => {
          const [v, h] = pos.split("-");
          return (
            <div
              key={pos}
              className="absolute bg-blue-500"
              style={{
                width: 8,
                height: 8,
                borderRadius: 1,
                [v ?? "top"]: -4,
                [h ?? "left"]: -4,
              }}
            />
          );
        })}
      </div>
      <div
        className="fixed pointer-events-none bg-blue-500 text-white font-medium whitespace-nowrap"
        style={{
          zIndex: 2147483647,
          top: rect.top + rect.height + 4,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
          padding: "2px 6px",
          borderRadius: 4,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace",
          fontSize: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {Math.round(rect.width)} × {Math.round(rect.height)}
      </div>
    </>
  );
}

function findTextRange(searchText: string, ancestorSelector: string): Range | null {
  const ancestor = ancestorSelector ? document.querySelector(ancestorSelector) : document.body;
  if (!ancestor) return null;
  const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const idx = node.textContent?.indexOf(searchText) ?? -1;
    if (idx >= 0) {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + searchText.length);
      return range;
    }
  }
  return null;
}

function TextHighlightOverlay({ rects }: { rects: DOMRect[] }) {
  return (
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          className="fixed pointer-events-none bg-[#975799]/25 rounded-sm"
          style={{ zIndex: 2147483647, top: r.top, left: r.left, width: r.width, height: r.height }}
        />
      ))}
    </>
  );
}

export function AnnotationOverlay() {
  const ext = useSyncExternalStore(
    (cb) => {
      _subs.add(cb);
      return () => {
        _subs.delete(cb);
      };
    },
    () => _ext,
  );

  const [pins, setPins] = useState<Map<string, PinData>>(new Map());
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [activeInputIsEdit, setActiveInputIsEdit] = useState(false);
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [textHighlightRects, setTextHighlightRects] = useState<DOMRect[]>([]);

  const hoveredRef = useRef<HTMLElement | null>(null);
  const pinCounterRef = useRef(0);
  const pinContextsRef = useRef(new Map<string, ExtractedContext>());
  const pinElementsRef = useRef(new Map<string, HTMLElement>());
  const pinSelectorsRef = useRef(new Map<string, string>());
  const pinTextRef = useRef(new Map<string, string>());
  const pinsRef = useRef(pins);
  const activeInputIdRef = useRef(activeInputId);

  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);
  useEffect(() => {
    activeInputIdRef.current = activeInputId;
  }, [activeInputId]);

  useEffect(() => {
    if (ext.remotePins === null) return;

    const newPins = new Map<string, PinData>();
    pinContextsRef.current.clear();
    pinElementsRef.current.clear();
    pinSelectorsRef.current.clear();
    pinTextRef.current.clear();
    let maxNum = 0;
    for (const [id, data] of Object.entries(ext.remotePins)) {
      newPins.set(id, {
        x: data.x,
        y: data.y,
        text: data.text,
        number: data.number,
        saved: true,
        type: data.type || "element",
        selectedText: data.selectedText,
      });
      if (data.number > maxNum) maxNum = data.number;
      if (data.selectedText) {
        pinTextRef.current.set(id, data.selectedText);
      }
      const selectorForElement = data.type === "text" ? data.ancestorSelector : data.selector;
      if (selectorForElement) {
        pinSelectorsRef.current.set(id, selectorForElement);
        try {
          const el = document.querySelector(selectorForElement);
          if (el instanceof HTMLElement) {
            pinElementsRef.current.set(id, el);
            pinContextsRef.current.set(id, captureContext(el));
          }
        } catch {}
      }
    }
    pinCounterRef.current = maxNum;
    setPins(newPins);
    setActiveInputId(null);
    setTooltipId(null);
    setHighlight(null); setTextHighlightRects([]);
  }, [ext.remotePins]);

  const persistAnnotations = useCallback(
    (currentPins: Map<string, PinData>) => {
      const stored: Record<string, StoredPin> = {};
      for (const [id, pin] of currentPins) {
        if (!pin.saved) continue;
        stored[id] = {
          x: pin.x,
          y: pin.y,
          text: pin.text,
          number: pin.number,
          selector: pinSelectorsRef.current.get(id) || "",
          type: pin.type,
          selectedText: pin.type === "text" ? pinTextRef.current.get(id) : undefined,
          ancestorSelector: pin.type === "text" ? pinSelectorsRef.current.get(id) : undefined,
        };
      }
      updateCurrentPins(stored);
      chrome.runtime.sendMessage({
        type: "ANNOTATIONS_CHANGED",
        payload: { pageUrl: getPageUrl(), pins: stored },
      });
    },
    [],
  );

  const showPinHighlight = useCallback((pinId: string) => {
    const pinSelectedText = pinTextRef.current.get(pinId);
    if (pinSelectedText) {
      const range = findTextRange(pinSelectedText, pinSelectorsRef.current.get(pinId) || "");
      if (range) {
        setTextHighlightRects(Array.from(range.getClientRects()));
        setHighlight(null);
        return;
      }
    }
    const el = pinElementsRef.current.get(pinId);
    if (!el || !el.isConnected) return;
    const rect = el.getBoundingClientRect();
    setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setTextHighlightRects([]);
  }, []);

  const handlePinDragEnd = useCallback(
    (id: string, newX: number, newY: number) => {
      setPins((prev) => {
        const next = new Map(prev);
        const pin = next.get(id);
        if (!pin) return prev;
        next.set(id, { ...pin, x: newX, y: newY });
        if (pin.saved) persistAnnotations(next);
        return next;
      });
    },
    [persistAnnotations],
  );

  const handlePinClick = useCallback(
    (id: string) => {
      if (activeInputIdRef.current === id) {
        setActiveInputId(null);
        setHighlight(null); setTextHighlightRects([]);
        return;
      }
      setTooltipId(null);
      setActiveInputId(id);
      setActiveInputIsEdit(true);
      setHighlight(null); setTextHighlightRects([]);
      showPinHighlight(id);
    },
    [showPinHighlight],
  );

  const handlePinHover = useCallback(
    (id: string) => {
      if (activeInputIdRef.current) return;
      setTooltipId(id);
      showPinHighlight(id);
    },
    [showPinHighlight],
  );

  const handlePinLeave = useCallback(() => {
    setTooltipId(null);
    if (!activeInputIdRef.current) setHighlight(null); setTextHighlightRects([]);
  }, []);

  const handleInputSave = useCallback(
    (pinId: string, text: string) => {
      setPins((prev) => {
        const next = new Map(prev);
        const pin = next.get(pinId);
        if (!pin) return prev;
        const updated = { ...pin, text, saved: true };
        if (!pin.saved) {
          pinCounterRef.current++;
          updated.number = pinCounterRef.current;
        }
        next.set(pinId, updated);
        persistAnnotations(next);
        return next;
      });
      setActiveInputId(null);
      setHighlight(null); setTextHighlightRects([]);
    },
    [persistAnnotations],
  );

  const handleInputTask = useCallback(
    (pinId: string, text: string) => {
      const pinData = pinsRef.current.get(pinId);
      chrome.runtime.sendMessage({
        type: "SAVE_ANNOTATION_TASK",
        payload: {
          title: text,
          pageUrl: window.location.href,
          position: pinData ? { x: pinData.x, y: pinData.y } : { x: 0, y: 0 },
          pinId,
          elementContext: pinContextsRef.current.get(pinId) ?? undefined,
        },
      });
      setPins((prev) => {
        const next = new Map(prev);
        next.delete(pinId);
        persistAnnotations(next);
        return next;
      });
      pinContextsRef.current.delete(pinId);
      pinElementsRef.current.delete(pinId);
      pinSelectorsRef.current.delete(pinId);
      pinTextRef.current.delete(pinId);
      setActiveInputId(null);
      setHighlight(null); setTextHighlightRects([]);
    },
    [persistAnnotations],
  );

  const handleInputCancel = useCallback((pinId: string) => {
    const pin = pinsRef.current.get(pinId);
    if (pin && !pin.saved) {
      setPins((prev) => {
        const next = new Map(prev);
        next.delete(pinId);
        return next;
      });
      pinContextsRef.current.delete(pinId);
      pinElementsRef.current.delete(pinId);
      pinSelectorsRef.current.delete(pinId);
      pinTextRef.current.delete(pinId);
    }
    setActiveInputId(null);
    setHighlight(null); setTextHighlightRects([]);
  }, []);

  const handleInputDelete = useCallback(
    (pinId: string) => {
      setPins((prev) => {
        const next = new Map(prev);
        next.delete(pinId);
        persistAnnotations(next);
        return next;
      });
      pinContextsRef.current.delete(pinId);
      pinElementsRef.current.delete(pinId);
      pinSelectorsRef.current.delete(pinId);
      pinTextRef.current.delete(pinId);
      setActiveInputId(null);
      setHighlight(null); setTextHighlightRects([]);
    },
    [persistAnnotations],
  );

  useEffect(() => {
    if (!ext.active) {
      hoveredRef.current = null;
      if (activeInputIdRef.current) {
        const pin = pinsRef.current.get(activeInputIdRef.current);
        if (pin && !pin.saved) {
          setPins((prev) => {
            const next = new Map(prev);
            if (activeInputIdRef.current) next.delete(activeInputIdRef.current);
            return next;
          });
        }
        setActiveInputId(null);
      }
      setHighlight(null); setTextHighlightRects([]);
      document.body.style.cursor = "";
      return;
    }

    document.body.style.cursor = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M6 4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-6 5v-5H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z' fill='%23975799' stroke='white' stroke-width='1.5'/><path d='M16 10v8M12 14h8' stroke='white' stroke-width='2' stroke-linecap='round'/></svg>") 16 16, crosshair`;
    let mouseDownPos: { x: number; y: number } | null = null;

    function handleMouseDown(e: MouseEvent) {
      if (activeInputIdRef.current) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-conductor-overlay]")) return;
      mouseDownPos = { x: e.clientX, y: e.clientY };
    }

    function handleMouseUp(e: MouseEvent) {
      if (activeInputIdRef.current) { mouseDownPos = null; return; }
      if (!mouseDownPos) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-conductor-overlay]")) { mouseDownPos = null; return; }

      const selection = window.getSelection();
      const selText = selection?.toString().trim() || "";

      e.preventDefault();
      e.stopPropagation();

      const pinId = crypto.randomUUID();

      if (selText.length > 0 && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + window.scrollX;
        const y = rect.top + window.scrollY;

        const ancestor = range.commonAncestorContainer instanceof HTMLElement
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
        if (ancestor) {
          pinSelectorsRef.current.set(pinId, generateSelector(ancestor));
          pinElementsRef.current.set(pinId, ancestor);
          pinContextsRef.current.set(pinId, captureContext(ancestor));
        }
        pinTextRef.current.set(pinId, selText);

        setPins((prev) => {
          const next = new Map(prev);
          next.set(pinId, { x, y, text: "", number: 0, saved: false, type: "text", selectedText: selText });
          return next;
        });
        selection.removeAllRanges();
      } else {
        const x = e.pageX;
        const y = e.pageY;
        const newPin: PinData = { x, y, text: "", number: 0, saved: false, type: "element" };

        if (hoveredRef.current) {
          pinContextsRef.current.set(pinId, captureContext(hoveredRef.current));
          pinElementsRef.current.set(pinId, hoveredRef.current);
          pinSelectorsRef.current.set(pinId, generateSelector(hoveredRef.current));
        }

        setPins((prev) => {
          const next = new Map(prev);
          next.set(pinId, newPin);
          return next;
        });
      }

      setHighlight(null); setTextHighlightRects([]);
      setActiveInputId(pinId);
      setActiveInputIsEdit(false);
      mouseDownPos = null;
    }

    function handleMouseMove(e: MouseEvent) {
      if (activeInputIdRef.current) return;
      if (mouseDownPos) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || !(target instanceof HTMLElement)) return;
      if (target.closest("[data-conductor-overlay]")) return;
      if (target === hoveredRef.current) return;
      hoveredRef.current = target;
      const rect = target.getBoundingClientRect();
      setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }

    function handleMouseOut(e: MouseEvent) {
      if (e.relatedTarget === null) {
        hoveredRef.current = null;
        setHighlight(null); setTextHighlightRects([]);
      }
    }

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseout", handleMouseOut, true);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.body.style.cursor = "";
    };
  }, [ext.active]);

  useEffect(() => {
    if (pins.size === 0 && !ext.active) return;

    function handlePassiveClick(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-conductor-overlay]")) return;
      if (activeInputIdRef.current && !_ext.active) {
        const pin = pinsRef.current.get(activeInputIdRef.current);
        if (pin && !pin.saved) {
          setPins((prev) => {
            const next = new Map(prev);
            if (activeInputIdRef.current) next.delete(activeInputIdRef.current);
            return next;
          });
        }
        setActiveInputId(null);
        setHighlight(null); setTextHighlightRects([]);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (activeInputIdRef.current) {
        const pin = pinsRef.current.get(activeInputIdRef.current);
        if (pin && !pin.saved) {
          setPins((prev) => {
            const next = new Map(prev);
            if (activeInputIdRef.current) next.delete(activeInputIdRef.current);
            return next;
          });
        }
        setActiveInputId(null);
        setHighlight(null); setTextHighlightRects([]);
        e.preventDefault();
        return;
      }
      if (_ext.active) {
        deactivateAnnotation();
        chrome.runtime.sendMessage({ type: "STOP_ANNOTATION" });
        e.preventDefault();
      }
    }

    document.addEventListener("click", handlePassiveClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("click", handlePassiveClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [pins.size > 0 || ext.active]);

  const tooltipPin = tooltipId ? pins.get(tooltipId) : undefined;
  const activePin = activeInputId ? pins.get(activeInputId) : undefined;
  const dark = useSyncExternalStore(subscribeDark, getDark);

  return (
    <>
      {ext.active && (
        <>
          <div
            className="fixed inset-0 pointer-events-none rounded-md"
            style={{
              zIndex: 2147483644,
              border: "1px solid #975799",
              boxSizing: "border-box",
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 2147483644,
              border: "11px solid",
              borderImage: "linear-gradient(to right, #7a3a7c, #975799) 1",
              boxSizing: "border-box",
              filter: "blur(20px)",
              animation: "conductor-glow 0.8s ease-in-out infinite alternate",
            }}
          />
        </>
      )}

      {!ext.pinsHidden && (
        <>
          {highlight && <HighlightOverlay rect={highlight} />}
          {textHighlightRects.length > 0 && <TextHighlightOverlay rects={textHighlightRects} />}

          {Array.from(pins.entries()).map(([id, pin]) => (
            <PinComponent
              key={id}
              id={id}
              data={pin}
              onDragEnd={handlePinDragEnd}
              onClick={handlePinClick}
              onHover={handlePinHover}
              onLeave={handlePinLeave}
            />
          ))}

          {tooltipPin && tooltipId && !activeInputId && (
            <div
              className={`absolute pointer-events-none rounded-md border ${dark ? "bg-white text-neutral-800 border-neutral-200" : "bg-neutral-800 text-neutral-100 border-neutral-700"}`}
              style={{
                left: tooltipPin.x - 12,
                top: tooltipPin.y + 18,
                zIndex: 2147483645,
                maxWidth: 240,
                padding: "6px 8px",
                        fontSize: 12,
                lineHeight: 1.4,
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              }}
            >
              {tooltipPin.text}
            </div>
          )}

          {activePin && activeInputId && (
            <InputCard
              pinId={activeInputId}
              position={{ x: activePin.x, y: activePin.y }}
              initialText={activePin.text}
              pinNumber={activePin.number}
              elementHtml={pinContextsRef.current.get(activeInputId)?.element.outerHTML ?? ""}
              selectedText={pinTextRef.current.get(activeInputId)}
              isEdit={activeInputIsEdit}
              onSave={handleInputSave}
              onTask={handleInputTask}
              onCancel={handleInputCancel}
              onDelete={handleInputDelete}
            />
          )}
        </>
      )}
    </>
  );
}
