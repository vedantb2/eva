let capturedContext: unknown = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "sidepanel") return;
  port.onDisconnect.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "PANEL_CLOSED" }).catch(() => {});
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
    sendResponse: (response?: unknown) => void
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
        chrome.runtime.sendMessage({
          type: "ANNOTATIONS_CHANGED",
          payload: message.payload,
        });
        sendResponse({ success: true });
        break;
      }

      case "STOP_ANNOTATION": {
        chrome.runtime.sendMessage({ type: "STOP_ANNOTATION" });
        sendResponse({ success: true });
        break;
      }

      case "REQUEST_ANNOTATIONS": {
        chrome.runtime.sendMessage({ type: "REQUEST_ANNOTATIONS" });
        sendResponse({ success: true });
        break;
      }

      case "REQUEST_TOOLBAR_STATE":
      case "TOOLBAR_ADD_QUICK_TASKS":
      case "TOOLBAR_ADD_TO_PROJECT": {
        chrome.runtime.sendMessage({
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
  }
);
