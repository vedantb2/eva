import type { ExtensionMessage } from "@/shared/messaging";
import type { ExtractedContext } from "@/shared/types";
import { askQuestion, createTask, fetchRepos, getOrCreateSession } from "./api";

let capturedContext: ExtractedContext | null = null;

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    handleMessage(message, sender, sendResponse);
    return true;
  }
);

async function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  switch (message.type) {
    case "GET_REPOS": {
      try {
        const repos = await fetchRepos(message.payload.token);
        sendResponse({ success: true, repos });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }

    case "CREATE_TASK": {
      try {
        const { token, ...params } = message.payload;
        const result = await createTask(token, params);
        capturedContext = null;
        sendResponse({ success: true, taskId: result.taskId });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }

    case "ELEMENT_CAPTURED": {
      capturedContext = message.payload;
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

    case "GET_SESSION": {
      try {
        const session = await getOrCreateSession(
          message.payload.token,
          message.payload.repoId
        );
        sendResponse({ success: true, session });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }

    case "ASK_QUESTION": {
      try {
        const { token, ...params } = message.payload;
        await askQuestion(token, params);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
}
