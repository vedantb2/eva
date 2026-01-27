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

interface ExtState {
  active: boolean;
  remotePins: Record<string, StoredPin> | null;
  version: number;
}

let _ext: ExtState = { active: false, remotePins: null, version: 0 };
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
  _ext = { ..._ext, remotePins: stored, version: _ext.version + 1 };
  _emit();
}

export function clearAllAnnotations() {
  _ext = { active: false, remotePins: {}, version: _ext.version + 1 };
  _emit();
}

interface PinData {
  x: number;
  y: number;
  text: string;
  number: number;
  saved: boolean;
}

function isDark() {
  return document.documentElement.classList.contains("dark");
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

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
      className="absolute flex items-center justify-center rounded-full bg-teal-500 text-white font-semibold border-2 border-white cursor-pointer select-none"
      style={{
        left: x - 12,
        top: y - 12,
        width: 24,
        height: 24,
        fontSize: 11,
        fontFamily: FONT,
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
  isEdit,
  onSave,
  onTask,
  onCancel,
  onDelete,
}: InputCardProps) {
  const [text, setText] = useState(initialText);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dark = isDark();

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
        fontFamily: FONT,
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
            style={{ fontFamily: "inherit", fontSize: 11 }}
          >
            <IconTrash size={12} /> Delete
          </button>
        )}
      </div>
      {elementHtml && (
        <div className="px-3 pb-1">
          <button
            onClick={() => setDetailsOpen((v) => !v)}
            className={`flex items-center gap-1 w-full text-left border-none bg-transparent cursor-pointer text-xs ${dark ? "text-neutral-500 hover:text-neutral-600" : "text-neutral-400 hover:text-neutral-300"}`}
            style={{ fontFamily: "inherit", padding: 0 }}
          >
            <IconChevronRight
              size={12}
              style={{ transition: "transform 0.15s", transform: detailsOpen ? "rotate(90deg)" : "none" }}
            />
            Element Details
          </button>
          {detailsOpen && (
            <pre
              className={`mt-1 rounded-lg border px-2.5 py-2 text-xs leading-snug overflow-auto ${dark ? "bg-neutral-50 text-neutral-700 border-neutral-200" : "bg-neutral-900 text-neutral-300 border-neutral-700"}`}
              style={{ fontFamily: "monospace", maxHeight: 120, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, marginTop: 4 }}
            >
              {elementHtml}
            </pre>
          )}
        </div>
      )}
      <div className="px-3 pb-2">
        <textarea
          ref={textareaRef}
          rows={3}
          placeholder="Describe the issue..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border px-2.5 py-2 text-sm leading-snug outline-none resize-none ${dark ? "bg-neutral-50 text-neutral-800 border-neutral-200 placeholder-neutral-400" : "bg-neutral-900 text-neutral-100 border-neutral-700 placeholder-neutral-500"}`}
          style={{ fontFamily: "inherit", boxSizing: "border-box", display: "block" }}
        />
      </div>
      <div className={`flex items-center justify-between px-3 pb-3 border-t ${dark ? "border-neutral-100" : "border-neutral-700"}`} style={{ paddingTop: 10 }}>
        <button
          onClick={() => {
            if (text.trim()) onTask(pinId, text.trim());
          }}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 border-none cursor-pointer transition-colors"
          style={{ fontFamily: "inherit" }}
        >
          <IconCheckbox size={14} /> Create Task
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onCancel(pinId)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm border-none cursor-pointer transition-colors ${dark ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
            style={{ fontFamily: "inherit" }}
          >
            <IconX size={14} /> Cancel
          </button>
          <button
            onClick={() => {
              if (text.trim()) onSave(pinId, text.trim());
            }}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-400 border-none cursor-pointer transition-colors"
            style={{ fontFamily: "inherit" }}
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

  const hoveredRef = useRef<HTMLElement | null>(null);
  const pinCounterRef = useRef(0);
  const pinContextsRef = useRef(new Map<string, ExtractedContext>());
  const pinElementsRef = useRef(new Map<string, HTMLElement>());
  const pinSelectorsRef = useRef(new Map<string, string>());
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
    let maxNum = 0;
    for (const [id, data] of Object.entries(ext.remotePins)) {
      newPins.set(id, {
        x: data.x,
        y: data.y,
        text: data.text,
        number: data.number,
        saved: true,
      });
      if (data.number > maxNum) maxNum = data.number;
      if (data.selector) {
        pinSelectorsRef.current.set(id, data.selector);
        try {
          const el = document.querySelector(data.selector);
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
    setHighlight(null);
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
        };
      }
      chrome.runtime.sendMessage({
        type: "ANNOTATIONS_CHANGED",
        payload: { pageUrl: getPageUrl(), pins: stored },
      });
    },
    [],
  );

  const showPinHighlight = useCallback((pinId: string) => {
    const el = pinElementsRef.current.get(pinId);
    if (!el || !el.isConnected) return;
    const rect = el.getBoundingClientRect();
    setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
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
        setHighlight(null);
        return;
      }
      setTooltipId(null);
      setActiveInputId(id);
      setActiveInputIsEdit(true);
      setHighlight(null);
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
    if (!activeInputIdRef.current) setHighlight(null);
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
      setHighlight(null);
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
      setActiveInputId(null);
      setHighlight(null);
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
    }
    setActiveInputId(null);
    setHighlight(null);
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
      setActiveInputId(null);
      setHighlight(null);
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
      setHighlight(null);
      document.body.style.cursor = "";
      return;
    }

    document.body.style.cursor = "crosshair";

    function handleMouseMove(e: MouseEvent) {
      if (activeInputIdRef.current) return;
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
        setHighlight(null);
      }
    }

    function handleClick(e: MouseEvent) {
      if (activeInputIdRef.current) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-conductor-overlay]")) return;

      e.preventDefault();
      e.stopPropagation();

      const pinId = crypto.randomUUID();
      const x = e.pageX;
      const y = e.pageY;

      const newPin: PinData = { x, y, text: "", number: 0, saved: false };

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
      setHighlight(null);
      setActiveInputId(pinId);
      setActiveInputIsEdit(false);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseout", handleMouseOut, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
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
        setHighlight(null);
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
        setHighlight(null);
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
  const dark = isDark();

  return (
    <>
      {ext.active && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 2147483644,
            border: "10px solid",
            borderImage: "linear-gradient(to right, #0d9488, #14b8a6) 1",
            boxSizing: "border-box",
            filter: "blur(18px)",
            animation: "conductor-glow 0.8s ease-in-out infinite alternate",
          }}
        />
      )}

      {highlight && <HighlightOverlay rect={highlight} />}

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
            fontFamily: FONT,
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
          isEdit={activeInputIsEdit}
          onSave={handleInputSave}
          onTask={handleInputTask}
          onCancel={handleInputCancel}
          onDelete={handleInputDelete}
        />
      )}
    </>
  );
}
