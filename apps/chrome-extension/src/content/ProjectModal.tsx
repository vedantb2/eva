import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { subscribeDark, getDark } from "./theme";
import {
  getToolbarState,
  subscribeToolbar,
  setProjectModalOpen,
  setToolbarFeedback,
} from "./toolbar-state";
import { getAnnotationState, subscribeAnnotation } from "./AnnotationOverlay";
import { requestBackground } from "@/shared/messaging";
import { IconX } from "@tabler/icons-react";

function getPageUrl(): string {
  return window.location.origin + window.location.pathname;
}

export function ProjectModal() {
  const toolbar = useSyncExternalStore(subscribeToolbar, getToolbarState);
  const ext = useSyncExternalStore(subscribeAnnotation, getAnnotationState);
  const dark = useSyncExternalStore(subscribeDark, getDark);

  const [projects, setProjects] = useState<
    Array<{ id: string; title: string; phase: string }>
  >([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolbar.projectModalOpen) return;
    setLoadingProjects(true);
    setError(null);
    requestBackground("LIST_PROJECTS", { pageUrl: getPageUrl() }).then(
      (resp) => {
        setLoadingProjects(false);
        if (!resp.ok) {
          setError(resp.message);
          return;
        }
        setProjects(resp.projects.filter((p) => p.phase !== "completed"));
      },
    );
  }, [toolbar.projectModalOpen]);

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    const target = selectedProjectId
      ? { kind: "existing" as const, projectId: selectedProjectId }
      : { kind: "new" as const, title: newProjectTitle.trim() };

    const resp = await requestBackground("ADD_TO_PROJECT", {
      pageUrl: getPageUrl(),
      pins: ext.currentPins,
      target,
    });
    setSubmitting(false);
    if (!resp.ok) {
      setError(resp.message);
      return;
    }
    setProjectModalOpen(false);
    setToolbarFeedback(resp.message, "success");
    setNewProjectTitle("");
    setSelectedProjectId(null);
  }, [selectedProjectId, newProjectTitle, ext.currentPins]);

  const handleClose = useCallback(() => {
    setProjectModalOpen(false);
    setNewProjectTitle("");
    setSelectedProjectId(null);
    setError(null);
  }, []);

  if (!toolbar.projectModalOpen) return null;

  const canConfirm =
    !submitting && (newProjectTitle.trim().length > 0 || selectedProjectId);
  const pinCount = Object.keys(ext.currentPins).length;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 2147483646,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.4)",
  };

  const panelStyle: React.CSSProperties = {
    width: 380,
    maxHeight: "70vh",
    borderRadius: 12,
    background: dark ? "#1c1c1e" : "#fff",
    border: dark ? "1px solid #333" : "1px solid #e5e5e5",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: dark ? "#e4e4e7" : "#27272a",
    fontSize: 14,
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 8px",
            borderBottom: dark ? "1px solid #333" : "1px solid #e5e5e5",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            Add {pinCount} annotation{pinCount !== 1 ? "s" : ""} to project
          </span>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: dark ? "#a1a1aa" : "#71717a",
              padding: 4,
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflowY: "auto",
          }}
        >
          {error && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 13,
                background: dark ? "#3b1818" : "#fef2f2",
                color: dark ? "#ef4444" : "#dc2626",
                border: dark ? "1px solid #5c2020" : "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="New project title..."
            value={newProjectTitle}
            onChange={(e) => {
              setNewProjectTitle(e.target.value);
              setSelectedProjectId(null);
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: dark ? "1px solid #333" : "1px solid #e5e5e5",
              background: dark ? "#0a0a0a" : "#fafafa",
              color: dark ? "#e4e4e7" : "#27272a",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            autoFocus
          />

          {loadingProjects ? (
            <span
              style={{
                fontSize: 12,
                color: dark ? "#71717a" : "#a1a1aa",
              }}
            >
              Loading projects...
            </span>
          ) : (
            projects.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: dark ? "#71717a" : "#a1a1aa",
                  }}
                >
                  Or pick existing:
                </span>
                <div
                  style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setNewProjectTitle("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border:
                          selectedProjectId === p.id
                            ? "1px solid #109182"
                            : dark
                              ? "1px solid transparent"
                              : "1px solid transparent",
                        background:
                          selectedProjectId === p.id
                            ? dark
                              ? "#0c3a33"
                              : "#ecfdf5"
                            : "transparent",
                        color: dark ? "#e4e4e7" : "#27272a",
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <span>{p.title}</span>
                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.6,
                        }}
                      >
                        {p.phase}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: dark ? "1px solid #333" : "1px solid #e5e5e5",
          }}
        >
          <button
            disabled={!canConfirm}
            onClick={handleConfirm}
            style={{
              width: "100%",
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: canConfirm ? "#109182" : dark ? "#333" : "#e5e5e5",
              color: canConfirm ? "#fff" : dark ? "#71717a" : "#a1a1aa",
              fontSize: 13,
              fontWeight: 500,
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Creating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
