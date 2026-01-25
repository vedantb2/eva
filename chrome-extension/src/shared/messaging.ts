import type { ExtractedContext, RepoInfo, SessionInfo } from "./types";

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
  | "ASK_QUESTION";

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
  | AskQuestionMessage;

export const CONDUCTOR_URL =
  typeof chrome !== "undefined" &&
  chrome.runtime?.getManifest?.()?.version_name === "development"
    ? "http://localhost:3000"
    : "https://conductor-lake.vercel.app";
