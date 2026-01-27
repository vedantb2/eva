import { activate, deactivate } from "./selection-overlay";
import { activateAnnotation, deactivateAnnotation, setAnnotationsFromRemote } from "./annotation-overlay";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_SELECTION") {
    activate();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_SELECTION") {
    deactivate();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "START_ANNOTATION") {
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
    setAnnotationsFromRemote(message.payload.pins);
    sendResponse({ success: true });
    return true;
  }

  return false;
});
