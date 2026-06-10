import { createElement } from "react";
import { createShadowMount } from "./shadow-root";
import { requestBackground } from "../shared/messaging";
import type { PushMessage } from "../shared/messaging";
import {
  activateAnnotation,
  deactivateAnnotation,
  setAnnotationsFromRemote,
  clearAllAnnotations,
  AnnotationOverlay,
  getTrackedTaskIds,
  applyTaskStatuses,
} from "./AnnotationOverlay";
import { SelectionOverlay } from "./SelectionOverlay";
import { PageToolbar } from "./PageToolbar";
import { ProjectModal } from "./ProjectModal";
import {
  showToolbar,
  hideToolbar,
  setToolbarFeedback,
  setMode,
  registerInspectController,
  getToolbarState,
  subscribeToolbar,
} from "./toolbar-state";
import { formatInspectMarkdown, copyToClipboard } from "./inspect-markdown";
import type { ExtractedContext } from "../shared/types";

type ShadowMount = ReturnType<typeof createShadowMount>;

let annotationMount: ShadowMount | null = null;
let selectionMount: ShadowMount | null = null;
let toolbarMount: ShadowMount | null = null;
let projectModalMount: ShadowMount | null = null;

function ensureAnnotationMount() {
  if (annotationMount) return;
  annotationMount = createShadowMount();
  annotationMount.render(createElement(AnnotationOverlay));
}

function ensureToolbarMount() {
  if (toolbarMount) return;
  toolbarMount = createShadowMount();
  toolbarMount.render(createElement(PageToolbar));
}

function ensureProjectModalMount() {
  if (projectModalMount) return;
  projectModalMount = createShadowMount();
  projectModalMount.render(createElement(ProjectModal));
}

function destroySelection() {
  if (!selectionMount) return;
  selectionMount.unmount();
  selectionMount = null;
}

function getPageUrl(): string {
  return window.location.origin + window.location.pathname;
}

// ---- inspect mode controller ----

function startInspect() {
  destroySelection();
  selectionMount = createShadowMount();
  selectionMount.render(
    createElement(SelectionOverlay, {
      onCapture(context: ExtractedContext) {
        const markdown = formatInspectMarkdown(context);
        copyToClipboard(markdown).then((ok) => {
          setToolbarFeedback(
            ok ? "Copied to clipboard" : "Copy failed",
            ok ? "success" : "error",
          );
        });
        // Stay in inspect mode for repeated captures
      },
      onCancel() {
        setMode(null);
      },
    }),
  );
}

function stopInspect() {
  destroySelection();
}

registerInspectController({ start: startInspect, stop: stopInspect });

// ---- mode changes trigger annotation overlay ----

let _prevMode = getToolbarState().mode;
subscribeToolbar(() => {
  const mode = getToolbarState().mode;
  if (mode === _prevMode) return;

  // Leaving annotate
  if (_prevMode === "annotate" && mode !== "annotate") {
    deactivateAnnotation();
  }

  // Entering annotate
  if (mode === "annotate") {
    ensureAnnotationMount();
    activateAnnotation();
  }

  _prevMode = mode;
});

// ---- load annotations on show ----

async function loadAndShowAnnotations() {
  ensureAnnotationMount();
  ensureProjectModalMount();
  const resp = await requestBackground("LOAD_ANNOTATIONS", {
    pageUrl: getPageUrl(),
  });
  if (resp.ok) {
    setAnnotationsFromRemote(resp.pins);
    // Fire initial status sync
    const taskIds = getTrackedTaskIds();
    if (taskIds.length > 0) {
      const statusResp = await requestBackground("SYNC_TASK_STATUSES", {
        taskIds,
      });
      if (statusResp.ok) {
        applyTaskStatuses(statusResp.updates);
      }
    }
  }
}

// ---- push message listener (background → content) ----

chrome.runtime.onMessage.addListener(
  (message: PushMessage, _sender, sendResponse) => {
    if (message.type === "TOOLBAR_VISIBILITY_CHANGED") {
      if (message.visible) {
        ensureToolbarMount();
        showToolbar();
        loadAndShowAnnotations();
      } else {
        hideToolbar();
        deactivateAnnotation();
        clearAllAnnotations();
        destroySelection();
      }
      sendResponse({ ok: true });
      return true;
    }
    return false;
  },
);

// ---- status poller (15s interval) ----

setInterval(() => {
  const toolbar = getToolbarState();
  if (!toolbar.visible) return;
  const taskIds = getTrackedTaskIds();
  if (taskIds.length === 0) return;
  requestBackground("SYNC_TASK_STATUSES", { taskIds }).then((resp) => {
    if (resp.ok) {
      applyTaskStatuses(resp.updates);
    }
  });
}, 15_000);

// ---- startup ----

ensureToolbarMount();

requestBackground("GET_TOOLBAR_VISIBILITY", {}).then((resp) => {
  if (resp.visible) {
    showToolbar();
    loadAndShowAnnotations();
  }
});
