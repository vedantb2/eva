import { createElement, Fragment } from "react";
import { createShadowMount } from "./shadow-root";
import {
  AnnotationOverlay,
  setAnnotationsFromRemote,
  clearAllAnnotations,
  applyTaskStatuses,
  getTrackedTaskIds,
} from "./AnnotationOverlay";
import { SelectionOverlay } from "./SelectionOverlay";
import { PageToolbar } from "./PageToolbar";
import { ProjectModal } from "./ProjectModal";
import {
  showToolbar,
  hideToolbar,
  setToolbarFeedback,
  setMode,
  setSignedOut,
  getToolbarState,
  registerInspectController,
} from "./toolbar-state";
import { formatInspectMarkdown, copyToClipboard } from "./inspect-markdown";
import {
  requestBackground,
  type ToolbarVisibilityChangedMessage,
} from "@/shared/messaging";

type ShadowMount = ReturnType<typeof createShadowMount>;

function getPageUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

// Persistent overlays: the annotation layer and the toolbar (+ project modal).
// Both render nothing until activated, so mounting eagerly is cheap.
const annotationMount = createShadowMount();
annotationMount.render(createElement(AnnotationOverlay));

const toolbarMount = createShadowMount();
toolbarMount.render(
  createElement(
    Fragment,
    null,
    createElement(PageToolbar),
    createElement(ProjectModal),
  ),
);

// Inspect overlay is created on demand and torn down when the mode exits.
let selectionMount: ShadowMount | null = null;

registerInspectController({
  start() {
    if (selectionMount) return;
    selectionMount = createShadowMount();
    selectionMount.render(
      createElement(SelectionOverlay, {
        onCapture(context) {
          void copyToClipboard(formatInspectMarkdown(context)).then((ok) => {
            setToolbarFeedback(
              ok ? "Copied to clipboard" : "Copy failed",
              ok ? "success" : "error",
            );
          });
          // Stay active for repeated captures until the mode is toggled off.
        },
        onCancel() {
          setMode(null);
        },
      }),
    );
  },
  stop() {
    if (!selectionMount) return;
    selectionMount.unmount();
    selectionMount = null;
  },
});

async function syncStatusesOnce(): Promise<void> {
  const ids = getTrackedTaskIds();
  if (ids.length === 0) return;
  const res = await requestBackground("SYNC_TASK_STATUSES", { taskIds: ids });
  if (res.ok) applyTaskStatuses(res.updates);
}

async function showToolbarAndLoad(): Promise<void> {
  showToolbar();
  const res = await requestBackground("LOAD_ANNOTATIONS", {
    pageUrl: getPageUrl(),
  });
  if (res.ok) {
    setSignedOut(false);
    setAnnotationsFromRemote(res.pins);
    void syncStatusesOnce();
  } else if (res.code === "not_signed_in") {
    setSignedOut(true);
  }
}

// React to the icon-driven visibility toggle from the background.
chrome.runtime.onMessage.addListener(
  (message: ToolbarVisibilityChangedMessage, _sender, sendResponse) => {
    if (message?.type !== "TOOLBAR_VISIBILITY_CHANGED") return false;
    if (message.payload.visible) {
      void showToolbarAndLoad();
    } else {
      hideToolbar();
      clearAllAnnotations();
    }
    sendResponse({ ok: true });
    return true;
  },
);

// Poll task statuses while the toolbar is visible and tracking tasks.
setInterval(() => {
  if (!getToolbarState().visible) return;
  void syncStatusesOnce();
}, 15000);

// On load, restore the toolbar if it was left visible for this tab.
void (async () => {
  const res = await requestBackground("GET_TOOLBAR_VISIBILITY", undefined);
  if (res.visible) void showToolbarAndLoad();
})();
