import type { ExtractedContext } from "@/shared/types";

let capturedContext: ExtractedContext | null = null;

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

interface ExtensionMessage {
  type: string;
  payload?: ExtractedContext;
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    switch (message.type) {
      case "ELEMENT_CAPTURED": {
        capturedContext = message.payload ?? null;
        chrome.runtime.sendMessage({
          type: "ELEMENT_CAPTURED",
          payload: message.payload,
        });
        sendResponse({ success: true });
        break;
      }

      case "SELECTION_CANCELLED": {
        chrome.runtime.sendMessage({ type: "SELECTION_CANCELLED" });
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

      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }
    return true;
  }
);
