import type { ExtractedContext } from "./types";
import type { Id } from "@conductor/backend";

export type TaskStatus =
  | "draft"
  | "todo"
  | "in_progress"
  | "code_review"
  | "business_review"
  | "done"
  | "cancelled";

export type MessageType =
  | "START_SELECTION"
  | "STOP_SELECTION"
  | "ELEMENT_CAPTURED"
  | "SELECTION_CANCELLED"
  | "GET_CAPTURED_CONTEXT"
  | "CLEAR_CONTEXT"
  | "START_ANNOTATION"
  | "STOP_ANNOTATION"
  | "SAVE_ANNOTATION_TASK"
  | "ANNOTATION_TASK_CREATED"
  | "ANNOTATION_STATUS_SYNC"
  | "ANNOTATIONS_LOADED"
  | "ANNOTATIONS_CHANGED"
  | "SHOW_TOOLBAR"
  | "HIDE_TOOLBAR"
  | "TOOLBAR_ADD_QUICK_TASKS"
  | "TOOLBAR_ADD_TO_PROJECT"
  | "TOOLBAR_RESULT"
  | "RUN_ALL_ANNOTATIONS"
  | "RUN_ALL_RESULT"
  | "RUN_ANNOTATION_TASK"
  | "PANEL_CLOSED"
  | "REQUEST_ANNOTATIONS"
  | "REQUEST_TOOLBAR_STATE";

export interface StartSelectionMessage {
  type: "START_SELECTION";
}

export interface StopSelectionMessage {
  type: "STOP_SELECTION";
}

export interface ElementCapturedMessage {
  type: "ELEMENT_CAPTURED";
  payload: ExtractedContext;
}

export interface SelectionCancelledMessage {
  type: "SELECTION_CANCELLED";
}

export interface GetCapturedContextMessage {
  type: "GET_CAPTURED_CONTEXT";
}

export interface GetCapturedContextResponse {
  context: ExtractedContext | null;
}

export interface ClearContextMessage {
  type: "CLEAR_CONTEXT";
}

export interface StartAnnotationMessage {
  type: "START_ANNOTATION";
}

export interface StopAnnotationMessage {
  type: "STOP_ANNOTATION";
}

export interface SaveAnnotationTaskMessage {
  type: "SAVE_ANNOTATION_TASK";
  payload: {
    title: string;
    pageUrl: string;
    position: { x: number; y: number };
    pinId: string;
    elementContext?: ExtractedContext;
  };
}

export interface StoredPin {
  x: number;
  y: number;
  text: string;
  number: number;
  selector: string;
  type?: "element" | "text";
  selectedText?: string;
  ancestorSelector?: string;
  taskId?: string;
  status?: TaskStatus;
  userId?: string;
  creatorInitials?: string;
}

export interface AnnotationTaskCreatedMessage {
  type: "ANNOTATION_TASK_CREATED";
  payload: {
    pinId: string;
    taskId: string;
    userId?: string;
    creatorInitials?: string;
  };
}

export interface RunAnnotationTaskMessage {
  type: "RUN_ANNOTATION_TASK";
  payload: {
    taskId: string;
  };
}

export interface PanelClosedMessage {
  type: "PANEL_CLOSED";
}

export interface RequestAnnotationsMessage {
  type: "REQUEST_ANNOTATIONS";
}

export interface RequestToolbarStateMessage {
  type: "REQUEST_TOOLBAR_STATE";
}

export interface AnnotationStatusSyncMessage {
  type: "ANNOTATION_STATUS_SYNC";
  payload: {
    updates: Record<string, { status: TaskStatus }>;
  };
}

export interface AnnotationsLoadedMessage {
  type: "ANNOTATIONS_LOADED";
  payload: {
    pins: Record<string, StoredPin>;
  };
}

export interface AnnotationsChangedMessage {
  type: "ANNOTATIONS_CHANGED";
  payload: {
    pageUrl: string;
    pins: Record<string, StoredPin>;
  };
}

export interface ShowToolbarMessage {
  type: "SHOW_TOOLBAR";
}

export interface HideToolbarMessage {
  type: "HIDE_TOOLBAR";
}

export interface ToolbarAddQuickTasksMessage {
  type: "TOOLBAR_ADD_QUICK_TASKS";
  payload: {
    pageUrl: string;
    pins: Record<string, StoredPin>;
  };
}

export interface ToolbarAddToProjectMessage {
  type: "TOOLBAR_ADD_TO_PROJECT";
  payload: {
    pageUrl: string;
    pins: Record<string, StoredPin>;
  };
}

export interface ToolbarResultMessage {
  type: "TOOLBAR_RESULT";
  payload: {
    success: boolean;
    message: string;
  };
}

export interface RunAllAnnotationsMessage {
  type: "RUN_ALL_ANNOTATIONS";
  payload: {
    pageUrl: string;
    pins: Record<string, StoredPin>;
  };
}

export interface RunAllResultMessage {
  type: "RUN_ALL_RESULT";
  payload: {
    success: boolean;
    message: string;
  };
}

export type ExtensionMessage =
  | StartSelectionMessage
  | StopSelectionMessage
  | ElementCapturedMessage
  | SelectionCancelledMessage
  | GetCapturedContextMessage
  | ClearContextMessage
  | StartAnnotationMessage
  | StopAnnotationMessage
  | SaveAnnotationTaskMessage
  | AnnotationTaskCreatedMessage
  | AnnotationStatusSyncMessage
  | AnnotationsLoadedMessage
  | AnnotationsChangedMessage
  | ShowToolbarMessage
  | HideToolbarMessage
  | ToolbarAddQuickTasksMessage
  | ToolbarAddToProjectMessage
  | ToolbarResultMessage
  | RunAllAnnotationsMessage
  | RunAllResultMessage
  | RunAnnotationTaskMessage
  | PanelClosedMessage
  | RequestAnnotationsMessage
  | RequestToolbarStateMessage;

export const EVA_URL =
  typeof chrome !== "undefined" &&
  chrome.runtime?.getManifest?.()?.version_name === "development"
    ? "http://localhost:3000"
    : "https://eva-git-staging-vedantb.vercel.app";

export function isSessionId(value: unknown): value is Id<"sessions"> {
  return typeof value === "string" && value.length > 0;
}

export function isRepoId(value: unknown): value is Id<"githubRepos"> {
  return typeof value === "string" && value.length > 0;
}

export function isTaskId(value: unknown): value is Id<"agentTasks"> {
  return typeof value === "string" && value.length > 0;
}

export function sendExtensionMessage(message: ExtensionMessage): Promise<void> {
  return chrome.runtime.sendMessage(message).catch(() => {});
}

export function sendTabMessage(tabId: number, message: ExtensionMessage): void {
  void chrome.tabs.sendMessage(tabId, message).catch(() => {});
}
