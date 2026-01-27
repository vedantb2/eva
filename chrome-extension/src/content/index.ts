import { createElement } from "react";
import { createShadowMount } from "./shadow-root";
import {
  activateAnnotation,
  deactivateAnnotation,
  setAnnotationsFromRemote,
  AnnotationOverlay,
} from "./AnnotationOverlay";
import { SelectionOverlay } from "./SelectionOverlay";

type ShadowMount = ReturnType<typeof createShadowMount>;

let annotationMount: ShadowMount | null = null;
let selectionMount: ShadowMount | null = null;

function ensureAnnotationMount() {
  if (annotationMount) return;
  annotationMount = createShadowMount();
  annotationMount.render(createElement(AnnotationOverlay));
}

function destroySelection() {
  if (!selectionMount) return;
  selectionMount.unmount();
  selectionMount = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_SELECTION") {
    destroySelection();
    selectionMount = createShadowMount();
    selectionMount.render(
      createElement(SelectionOverlay, {
        onCapture(context) {
          chrome.runtime.sendMessage({ type: "ELEMENT_CAPTURED", payload: context });
          destroySelection();
        },
        onCancel() {
          chrome.runtime.sendMessage({ type: "SELECTION_CANCELLED" });
          destroySelection();
        },
      }),
    );
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_SELECTION") {
    destroySelection();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "START_ANNOTATION") {
    ensureAnnotationMount();
    activateAnnotation();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_ANNOTATION") {
    deactivateAnnotation();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "ANNOTATIONS_LOADED") {
    ensureAnnotationMount();
    setAnnotationsFromRemote(message.payload.pins);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

chrome.runtime.sendMessage({ type: "REQUEST_ANNOTATIONS" });
