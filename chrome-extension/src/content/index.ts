import { activate, deactivate } from "./selection-overlay";

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

  return false;
});
