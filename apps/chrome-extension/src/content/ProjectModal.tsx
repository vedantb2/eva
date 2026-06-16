import { useState, useEffect, useSyncExternalStore } from "react";
import { subscribeDark, getDark } from "./theme";
import {
  getToolbarState,
  subscribeToolbar,
  closeProjectModal,
  setToolbarFeedback,
  setSignedOut,
} from "./toolbar-state";
import { getAnnotationState } from "./AnnotationOverlay";
import { requestBackground, type AddToProjectTarget } from "@/shared/messaging";

interface ProjectItem {
  id: string;
  title: string;
  phase: string;
}

function getPageUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export function ProjectModal() {
  const toolbar = useSyncExternalStore(subscribeToolbar, getToolbarState);
  const dark = useSyncExternalStore(subscribeDark, getDark);
  const open = toolbar.projectModalOpen;

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setNewTitle("");
    void requestBackground("LIST_PROJECTS", { pageUrl: getPageUrl() }).then(
      (res) => {
        setLoading(false);
        if (res.ok) {
          setProjects(res.projects.filter((p) => p.phase !== "completed"));
        } else {
          if (res.code === "not_signed_in") setSignedOut(true);
          setError(res.message);
        }
      },
    );
  }, [open]);

  if (!open) return null;

  const pinCount = Object.keys(getAnnotationState().currentPins).length;

  const target: AddToProjectTarget | null = selectedId
    ? { kind: "existing", projectId: selectedId }
    : newTitle.trim()
      ? { kind: "new", title: newTitle.trim() }
      : null;

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    setError(null);
    const res = await requestBackground("ADD_TO_PROJECT", {
      pageUrl: getPageUrl(),
      pins: getAnnotationState().currentPins,
      target,
    });
    setSubmitting(false);
    if (res.ok) {
      closeProjectModal();
      setToolbarFeedback(res.message, "success");
    } else {
      if (res.code === "not_signed_in") setSignedOut(true);
      setError(res.message);
    }
  };

  const surface = dark
    ? "bg-neutral-800 border-neutral-700 text-neutral-100"
    : "bg-white border-neutral-200 text-neutral-800";
  const subtle = dark ? "text-neutral-400" : "text-neutral-500";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 2147483646, background: "rgba(0,0,0,0.4)" }}
      onClick={() => closeProjectModal()}
    >
      <div
        className={`rounded-lg border ${surface}`}
        style={{
          width: 380,
          maxWidth: "90vw",
          boxShadow: "0 12px 48px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-sm font-medium">
            Add {pinCount} annotation{pinCount !== 1 ? "s" : ""} to a project
          </span>
          <button
            onClick={() => closeProjectModal()}
            className={`border-none bg-transparent cursor-pointer text-sm ${subtle}`}
          >
            Cancel
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <input
            type="text"
            placeholder="New project title..."
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setSelectedId(null);
            }}
            className={`w-full rounded-lg border px-2.5 py-2 text-sm outline-none ${
              dark
                ? "bg-neutral-900 border-neutral-700 text-neutral-100 placeholder-neutral-500"
                : "bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-400"
            }`}
            style={{ boxSizing: "border-box" }}
          />

          {loading ? (
            <p className={`text-xs ${subtle}`}>Loading projects…</p>
          ) : projects.length > 0 ? (
            <div
              className="space-y-1"
              style={{ maxHeight: 160, overflowY: "auto" }}
            >
              <p className={`text-xs ${subtle}`}>Or pick existing:</p>
              {projects.map((project) => {
                const active = selectedId === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedId(project.id);
                      setNewTitle("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-sm text-left cursor-pointer transition-colors ${
                      active
                        ? "bg-[#109182] border-[#109182] text-white"
                        : dark
                          ? "bg-neutral-900 border-neutral-700 hover:bg-neutral-700"
                          : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    <span className="truncate">{project.title}</span>
                    <span className="ml-2 text-xs opacity-60">
                      {project.phase}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            disabled={!target || submitting}
            onClick={handleConfirm}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-white bg-[#109182] hover:bg-[#2db8a4] border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
