import { useRef, useCallback, useSyncExternalStore } from "react";
import {
  IconEye,
  IconEyeOff,
  IconMapPin,
  IconSearch,
} from "@tabler/icons-react";
import {
  getAnnotationState,
  subscribeAnnotation,
  togglePinsHidden,
} from "./AnnotationOverlay";
import { subscribeDark, getDark } from "./theme";
import {
  subscribeToolbar,
  getToolbarState,
  setMode,
  setToolbarLoading,
  setToolbarFeedback,
  setSignedOut,
  setProjectModalOpen,
  setToolbarPosition,
} from "./toolbar-state";
import { requestBackground } from "@/shared/messaging";
import type { StoredPin } from "@/shared/messaging";
import { notifyTasksCreated } from "./AnnotationOverlay";

function getPageUrl(): string {
  return window.location.origin + window.location.pathname;
}

function dividerStyle(dark: boolean): React.CSSProperties {
  return {
    width: 1,
    height: 24,
    background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
  };
}

function feedbackStyle(type: "success" | "error"): React.CSSProperties {
  return {
    fontSize: 12,
    color: type === "success" ? "#16a34a" : "#dc2626",
    fontWeight: 500,
  };
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  dark,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  dark: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 9999,
        border: active ? "1.5px solid #109182" : "1.5px solid transparent",
        background: active
          ? dark
            ? "rgba(16, 145, 130, 0.15)"
            : "rgba(16, 145, 130, 0.1)"
          : "transparent",
        color: active
          ? "#109182"
          : disabled
            ? dark
              ? "#555"
              : "#bbb"
            : dark
              ? "#a1a1aa"
              : "#71717a",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function ActionButton({
  onClick,
  children,
  variant,
  disabled,
  dark,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant: "primary" | "outline";
  disabled?: boolean;
  dark: boolean;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      disabled={disabled}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 9999,
        border: isPrimary
          ? "none"
          : dark
            ? "1px solid rgba(255,255,255,0.15)"
            : "1px solid rgba(0,0,0,0.12)",
        background: isPrimary
          ? disabled
            ? dark
              ? "#555"
              : "#ccc"
            : "#109182"
          : "transparent",
        color: isPrimary ? "#fff" : dark ? "#e4e4e7" : "#27272a",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

async function handleRunAll(pins: Record<string, StoredPin>) {
  setToolbarLoading(true);
  const resp = await requestBackground("RUN_ALL_ANNOTATIONS", {
    pageUrl: getPageUrl(),
    pins,
  });
  if (!resp.ok) {
    if (resp.code === "not_signed_in") {
      setSignedOut(true);
    }
    setToolbarFeedback(resp.message, "error");
    return;
  }
  notifyTasksCreated(resp.created, resp.userId, resp.creatorInitials);
  setToolbarFeedback(resp.message, "success");
}

export function PageToolbar() {
  const toolbar = useSyncExternalStore(subscribeToolbar, getToolbarState);
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
    const state = getToolbarState();
    if (el && state.x === -1) {
      const rect = el.getBoundingClientRect();
      setToolbarPosition(rect.left, rect.top);
    }
    const s = getToolbarState();
    startX.current = s.x;
    startY.current = s.y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = elRef.current;
    const w = el ? el.offsetWidth : 300;
    const h = el ? el.offsetHeight : 40;
    const nx = Math.max(
      0,
      Math.min(
        window.innerWidth - w,
        startX.current + (e.clientX - dragStartX.current),
      ),
    );
    const ny = Math.max(
      0,
      Math.min(
        window.innerHeight - h,
        startY.current + (e.clientY - dragStartY.current),
      ),
    );
    setToolbarPosition(nx, ny);
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (!toolbar.visible) return null;

  const pins = ext.currentPins;
  const pinCount = Object.keys(pins).length;
  const hasPins = pinCount > 0;
  const disabled = !hasPins || toolbar.loading;

  const positioned = toolbar.x !== -1;
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 2147483645,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 9999,
    background: dark ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    boxShadow: dark
      ? "0 4px 24px rgba(0,0,0,0.25)"
      : "0 4px 24px rgba(0,0,0,0.1)",
    border: dark
      ? "1px solid rgba(255,255,255,0.1)"
      : "1px solid rgba(0,0,0,0.08)",
    fontSize: 14,
    color: dark ? "#e4e4e7" : "#27272a",
    whiteSpace: "nowrap",
    cursor: dragging.current ? "grabbing" : "grab",
    userSelect: "none",
    touchAction: "none",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ...(positioned
      ? { left: toolbar.x, top: toolbar.y }
      : { bottom: 16, left: "50%", transform: "translateX(-50%)" }),
  };

  const signedOutLink = toolbar.signedOut && (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        requestBackground("OPEN_EVA", {});
        setSignedOut(false);
      }}
      style={{
        background: "none",
        border: "none",
        color: "#109182",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        textDecoration: "underline",
        padding: 0,
      }}
    >
      Sign in to Eva
    </button>
  );

  return (
    <div
      ref={elRef}
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span style={{ fontWeight: 600, color: "#109182", fontSize: 14 }}>
        Eva
      </span>

      <div style={dividerStyle(dark)} />

      {/* Mode toggles */}
      <ToolbarButton
        active={toolbar.mode === "annotate"}
        onClick={() => setMode(toolbar.mode === "annotate" ? null : "annotate")}
        title="Annotate"
        dark={dark}
      >
        <IconMapPin size={16} />
      </ToolbarButton>

      <ToolbarButton
        active={toolbar.mode === "inspect"}
        onClick={() => setMode(toolbar.mode === "inspect" ? null : "inspect")}
        title="Inspect"
        dark={dark}
      >
        <IconSearch size={16} />
      </ToolbarButton>

      <div style={dividerStyle(dark)} />

      <span style={{ color: dark ? "#a1a1aa" : "#71717a", fontSize: 13 }}>
        {pinCount} annotation{pinCount !== 1 ? "s" : ""}
      </span>

      <ToolbarButton
        active={false}
        onClick={() => togglePinsHidden()}
        title={ext.pinsHidden ? "Show annotations" : "Hide annotations"}
        dark={dark}
      >
        {ext.pinsHidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </ToolbarButton>

      <div style={dividerStyle(dark)} />

      {signedOutLink}

      {toolbar.feedback ? (
        <span style={feedbackStyle(toolbar.feedback.type)}>
          {toolbar.feedback.message}
        </span>
      ) : (
        !toolbar.signedOut && (
          <>
            <ActionButton
              variant="primary"
              dark={dark}
              disabled={disabled}
              onClick={() => {
                if (hasPins) handleRunAll(pins);
              }}
            >
              Run All
            </ActionButton>
            <ActionButton
              variant="outline"
              dark={dark}
              disabled={disabled}
              onClick={() => {
                if (hasPins) setProjectModalOpen(true);
              }}
            >
              Add all to a Project
            </ActionButton>
          </>
        )
      )}
    </div>
  );
}
