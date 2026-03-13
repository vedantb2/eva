import { sendExtensionMessage, sendTabMessage } from "../shared/messaging";

let capturedContext: unknown = null;

function forwardRuntimeMessage(msg: { type: string; payload?: unknown }): void {
  void chrome.runtime.sendMessage(msg).catch(() => {});
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "sidepanel") return;
  port.onDisconnect.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          sendTabMessage(tab.id, { type: "PANEL_CLOSED" });
        }
      }
    });
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

interface ExtensionMessage {
  type: string;
  payload?: unknown;
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    switch (message.type) {
      case "ELEMENT_CAPTURED": {
        capturedContext = message.payload ?? null;
        sendResponse({ success: true });
        break;
      }

      case "SELECTION_CANCELLED": {
        sendResponse({ success: true });
        break;
      }

      case "GET_CAPTURED_CONTEXT": {
        sendResponse({ context: capturedContext });
        break;
      }

      case "CLEAR_CONTEXT": {
        capturedContext = null;
        sendResponse({ success: true });
        break;
      }

      case "ANNOTATIONS_CHANGED": {
        forwardRuntimeMessage({
          type: "ANNOTATIONS_CHANGED",
          payload: message.payload,
        });
        sendResponse({ success: true });
        break;
      }

      case "STOP_ANNOTATION": {
        void sendExtensionMessage({ type: "STOP_ANNOTATION" });
        sendResponse({ success: true });
        break;
      }

      case "REQUEST_ANNOTATIONS": {
        void sendExtensionMessage({ type: "REQUEST_ANNOTATIONS" });
        sendResponse({ success: true });
        break;
      }

      case "REQUEST_TOOLBAR_STATE":
      case "TOOLBAR_ADD_QUICK_TASKS":
      case "TOOLBAR_ADD_TO_PROJECT":
      case "RUN_ALL_ANNOTATIONS": {
        forwardRuntimeMessage({
          type: message.type,
          payload: message.payload,
        });
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }
    return true;
  },
);
