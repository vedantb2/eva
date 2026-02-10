import type { ExtractedContext, RepoInfo, SessionInfo } from "./types";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "business_review"
  | "code_review"
  | "done";

export type MessageType =
  | "START_SELECTION"
  | "STOP_SELECTION"
  | "ELEMENT_CAPTURED"
  | "SELECTION_CANCELLED"
  | "CREATE_TASK"
  | "GET_REPOS"
  | "GET_CAPTURED_CONTEXT"
  | "CLEAR_CONTEXT"
  | "GET_SESSION"
  | "ASK_QUESTION"
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
  | "PANEL_CLOSED";

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

export interface CreateTaskMessage {
  type: "CREATE_TASK";
  payload: {
    token: string;
    repoId: string;
    title: string;
    description: string;
    extensionContext: ExtractedContext | null;
    sourceUrl: string;
  };
}

export interface CreateTaskResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}

export interface GetReposMessage {
  type: "GET_REPOS";
  payload: {
    token: string;
  };
}

export interface GetReposResponse {
  success: boolean;
  repos?: RepoInfo[];
  error?: string;
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

export interface GetSessionMessage {
  type: "GET_SESSION";
  payload: {
    token: string;
    repoId: string;
  };
}

export interface GetSessionResponse {
  success: boolean;
  session?: SessionInfo;
  error?: string;
}

export interface AskQuestionMessage {
  type: "ASK_QUESTION";
  payload: {
    token: string;
    sessionId: string;
    message: string;
  };
}

export interface AskQuestionResponse {
  success: boolean;
  error?: string;
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
}

export interface AnnotationTaskCreatedMessage {
  type: "ANNOTATION_TASK_CREATED";
  payload: {
    pinId: string;
    taskId: string;
  };
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
  | CreateTaskMessage
  | GetReposMessage
  | GetCapturedContextMessage
  | ClearContextMessage
  | GetSessionMessage
  | AskQuestionMessage
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
  | RunAllResultMessage;

export const CONDUCTOR_URL =
  typeof chrome !== "undefined" &&
  chrome.runtime?.getManifest?.()?.version_name === "development"
    ? "http://localhost:3000"
    : "https://conductor-lake.vercel.app";
