import { useRef, useCallback, useSyncExternalStore } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { getAnnotationState, subscribeAnnotation, togglePinsHidden } from "./AnnotationOverlay";
import { subscribeDark, getDark } from "./theme";
import type { StoredPin } from "@/shared/messaging";

interface ToolbarState {
  visible: boolean;
  feedback: { message: string; type: "success" | "error" } | null;
  loading: boolean;
  x: number;
  y: number;
  version: number;
}

let _toolbar: ToolbarState = { visible: false, feedback: null, loading: false, x: -1, y: -1, version: 0 };
const _toolbarSubs = new Set<() => void>();
function _toolbarEmit() {
  _toolbarSubs.forEach((s) => s());
}

export function showToolbar() {
  _toolbar = { ..._toolbar, visible: true, version: _toolbar.version + 1 };
  _toolbarEmit();
}

export function hideToolbar() {
  _toolbar = { ..._toolbar, visible: false, version: _toolbar.version + 1 };
  _toolbarEmit();
}

export function setToolbarFeedback(message: string, type: "success" | "error") {
  _toolbar = { ..._toolbar, feedback: { message, type }, loading: false, version: _toolbar.version + 1 };
  _toolbarEmit();
  setTimeout(() => {
    _toolbar = { ..._toolbar, feedback: null, version: _toolbar.version + 1 };
    _toolbarEmit();
  }, 3000);
}

function getPageUrl(): string {
  return window.location.origin + window.location.pathname;
}

function sendPins(type: "TOOLBAR_ADD_QUICK_TASKS" | "TOOLBAR_ADD_TO_PROJECT", pins: Record<string, StoredPin>) {
  _toolbar = { ..._toolbar, loading: true, version: _toolbar.version + 1 };
  _toolbarEmit();
  chrome.runtime.sendMessage({ type, payload: { pageUrl: getPageUrl(), pins } });
}

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 12px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  transition: "opacity 0.15s",
  fontFamily: "inherit",
};

const disabledStyle: React.CSSProperties = { opacity: 0.4, cursor: "default" };

function btnTeal(): React.CSSProperties {
  return { ...btnBase, background: "#0d9488", color: "#fff" };
}

function btnOutline(dark: boolean): React.CSSProperties {
  return {
    ...btnBase,
    background: "transparent",
    color: dark ? "#e4e4e7" : "#3f3f46",
    border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.15)",
  };
}

function dividerStyle(dark: boolean): React.CSSProperties {
  return { width: 1, height: 20, background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" };
}

function feedbackStyle(type: "success" | "error"): React.CSSProperties {
  return { fontSize: 12, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 500 };
}

export function PageToolbar() {
  const toolbar = useSyncExternalStore(
    (cb) => { _toolbarSubs.add(cb); return () => { _toolbarSubs.delete(cb); }; },
    () => _toolbar,
  );
  const ext = useSyncExternalStore(subscribeAnnotation, getAnnotationState);
  const dark = useSyncExternalStore(subscribeDark, getDark);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const elRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    const el = elRef.current;
    if (el && _toolbar.x === -1) {
      const rect = el.getBoundingClientRect();
      _toolbar = { ..._toolbar, x: rect.left, y: rect.top, version: _toolbar.version + 1 };
      _toolbarEmit();
    }
    startX.current = _toolbar.x;
    startY.current = _toolbar.y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = elRef.current;
    const w = el ? el.offsetWidth : 300;
    const h = el ? el.offsetHeight : 40;
    const nx = Math.max(0, Math.min(window.innerWidth - w, startX.current + (e.clientX - dragStartX.current)));
    const ny = Math.max(0, Math.min(window.innerHeight - h, startY.current + (e.clientY - dragStartY.current)));
    _toolbar = { ..._toolbar, x: nx, y: ny, version: _toolbar.version + 1 };
    _toolbarEmit();
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (!toolbar.visible) return null;
  const pins = ext.currentPins;
  const pinCount = Object.keys(pins).length;
  const hasPins = pinCount > 0;
  const disabled = !hasPins || toolbar.loading;
  const teal = btnTeal();
  const outline = btnOutline(dark);

  const positioned = toolbar.x !== -1;
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 2147483645,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 9999,
    background: dark ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.25)" : "0 4px 24px rgba(0,0,0,0.1)",
    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13,
    color: dark ? "#e4e4e7" : "#27272a",
    whiteSpace: "nowrap",
    cursor: dragging.current ? "grabbing" : "grab",
    userSelect: "none",
    touchAction: "none",
    ...(positioned
      ? { left: toolbar.x, top: toolbar.y }
      : { bottom: 16, left: "50%", transform: "translateX(-50%)" }),
  };

  return (
    <div
      ref={elRef}
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span style={{ fontWeight: 600, color: "#14b8a6", fontSize: 13 }}>Eva</span>
      <div style={dividerStyle(dark)} />
      <span style={{ color: dark ? "#a1a1aa" : "#71717a", fontSize: 12 }}>
        {pinCount} annotation{pinCount !== 1 ? "s" : ""}
      </span>
      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 9999,
          border: "none",
          background: ext.pinsHidden
            ? (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)")
            : "transparent",
          color: ext.pinsHidden
            ? (dark ? "#a1a1aa" : "#71717a")
            : "#14b8a6",
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
          transition: "background 0.15s, color 0.15s",
        }}
        title={ext.pinsHidden ? "Show annotations" : "Hide annotations"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => togglePinsHidden()}
      >
        {ext.pinsHidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
      <div style={dividerStyle(dark)} />
      {toolbar.feedback ? (
        <span style={feedbackStyle(toolbar.feedback.type)}>{toolbar.feedback.message}</span>
      ) : (
        <>
          <button
            style={disabled ? { ...teal, ...disabledStyle } : teal}
            disabled={disabled}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => hasPins && sendPins("TOOLBAR_ADD_QUICK_TASKS", pins)}
          >
            Add all to Quick Tasks
          </button>
          <button
            style={disabled ? { ...outline, ...disabledStyle } : outline}
            disabled={disabled}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => hasPins && sendPins("TOOLBAR_ADD_TO_PROJECT", pins)}
          >
            Add all to a Project
          </button>
        </>
      )}
    </div>
  );
}
