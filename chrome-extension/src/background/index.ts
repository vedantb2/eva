import type { ExtensionMessage } from "@/shared/messaging";
import { CONDUCTOR_URL } from "@/shared/messaging";
import type { ExtractedContext } from "@/shared/types";
import { clearAuth, getToken, getUser, isAuthenticated, setAuth } from "./auth";
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
    case "GET_AUTH_STATE": {
      const authenticated = await isAuthenticated();
      const user = await getUser();
      sendResponse({ isAuthenticated: authenticated, user });
      break;
    }

    case "LOGIN": {
      chrome.tabs.create({ url: `${CONDUCTOR_URL}/api/extension/auth` });
      sendResponse({ success: true });
      break;
    }

    case "LOGOUT": {
      await clearAuth();
      capturedContext = null;
      sendResponse({ success: true });
      break;
    }

    case "AUTH_SUCCESS": {
      await setAuth(message.payload.token, message.payload.user);
      chrome.runtime.sendMessage({ type: "AUTH_SUCCESS" });
      sendResponse({ success: true });
      break;
    }

    case "GET_REPOS": {
      try {
        const repos = await fetchRepos();
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
        const result = await createTask(message.payload);
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
        const session = await getOrCreateSession(message.payload.repoId);
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
        await askQuestion(message.payload);
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

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (
      message.type === "CONDUCTOR_AUTH_SUCCESS" &&
      sender.url?.startsWith(CONDUCTOR_URL)
    ) {
      setAuth(message.token, message.user).then(() => {
        chrome.runtime.sendMessage({ type: "AUTH_SUCCESS" });
        sendResponse({ success: true });
      });
      return true;
    }
    return false;
  }
);
