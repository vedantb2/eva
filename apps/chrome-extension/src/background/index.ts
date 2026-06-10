import type { BgRequestType } from "../shared/messaging";
import {
  loadAnnotations,
  saveAnnotations,
  createAnnotationTask,
  runAnnotationTask,
  runAllAnnotations,
  listProjects,
  addToProject,
  syncTaskStatuses,
  openEva,
} from "./handlers";

// ---- toolbar visibility (per-tab, session storage) ----

function storageKey(tabId: number): string {
  return `toolbarVisible:${tabId}`;
}

async function setToolbarVisibility(
  tabId: number,
  visible: boolean,
): Promise<void> {
  await chrome.storage.session.set({ [storageKey(tabId)]: visible });

  if (visible) {
    await chrome.action.setBadgeText({ tabId, text: "●" });
    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: "#00000000",
    });
    await chrome.action.setBadgeTextColor({ tabId, color: "#22c55e" });
  } else {
    await chrome.action.setBadgeText({ tabId, text: "" });
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "TOOLBAR_VISIBILITY_CHANGED",
      visible,
    });
  } catch {
    // Tab unreachable (chrome:// page) — revert
    await chrome.storage.session.set({ [storageKey(tabId)]: !visible });
    if (!visible) {
      await chrome.action.setBadgeText({ tabId, text: "●" });
      await chrome.action.setBadgeBackgroundColor({
        tabId,
        color: "#00000000",
      });
      await chrome.action.setBadgeTextColor({ tabId, color: "#22c55e" });
    } else {
      await chrome.action.setBadgeText({ tabId, text: "" });
    }
  }
}

// ---- icon click toggles toolbar ----

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  const key = storageKey(tab.id);
  const result = await chrome.storage.session.get(key);
  const current = result[key] === true;
  await setToolbarVisibility(tab.id, !current);
});

// ---- cleanup on tab close ----

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(storageKey(tabId));
});

// ---- message router ----

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    const { type, payload } = message;

    if (type === "GET_TOOLBAR_VISIBILITY") {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ visible: false });
        return true;
      }
      chrome.storage.session.get(storageKey(tabId)).then((result) => {
        sendResponse({ visible: result[storageKey(tabId)] === true });
      });
      return true;
    }

    const handlers: Record<
      string,
      ((p: never) => Promise<unknown>) | ((p: never) => unknown) | undefined
    > = {
      LOAD_ANNOTATIONS: loadAnnotations,
      SAVE_ANNOTATIONS: saveAnnotations,
      CREATE_ANNOTATION_TASK: createAnnotationTask,
      RUN_ANNOTATION_TASK: runAnnotationTask,
      RUN_ALL_ANNOTATIONS: runAllAnnotations,
      LIST_PROJECTS: listProjects,
      ADD_TO_PROJECT: addToProject,
      SYNC_TASK_STATUSES: syncTaskStatuses,
      OPEN_EVA: openEva,
    } satisfies Partial<
      Record<BgRequestType, (p: never) => Promise<unknown> | unknown>
    >;

    const handler = handlers[type];
    if (!handler) {
      sendResponse({
        ok: false,
        code: "convex_error",
        message: "Unknown message type",
      });
      return true;
    }

    const result = handler(payload as never);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Unknown error";
        sendResponse({ ok: false, code: "convex_error", message: msg });
      });
    } else {
      sendResponse(result);
    }
    return true;
  },
);
