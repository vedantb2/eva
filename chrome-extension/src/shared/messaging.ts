import type { ExtractedContext, RepoInfo, UserInfo } from "./types";

export type MessageType =
  | "START_SELECTION"
  | "STOP_SELECTION"
  | "ELEMENT_CAPTURED"
  | "SELECTION_CANCELLED"
  | "CREATE_TASK"
  | "GET_REPOS"
  | "GET_AUTH_STATE"
  | "LOGIN"
  | "LOGOUT"
  | "AUTH_SUCCESS"
  | "GET_CAPTURED_CONTEXT"
  | "CLEAR_CONTEXT";

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
}

export interface GetReposResponse {
  success: boolean;
  repos?: RepoInfo[];
  error?: string;
}

export interface GetAuthStateMessage {
  type: "GET_AUTH_STATE";
}

export interface GetAuthStateResponse {
  isAuthenticated: boolean;
  user: UserInfo | null;
}

export interface LoginMessage {
  type: "LOGIN";
}

export interface LogoutMessage {
  type: "LOGOUT";
}

export interface AuthSuccessMessage {
  type: "AUTH_SUCCESS";
  payload: {
    token: string;
    user: UserInfo;
  };
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

export type ExtensionMessage =
  | StartSelectionMessage
  | StopSelectionMessage
  | ElementCapturedMessage
  | SelectionCancelledMessage
  | CreateTaskMessage
  | GetReposMessage
  | GetAuthStateMessage
  | LoginMessage
  | LogoutMessage
  | AuthSuccessMessage
  | GetCapturedContextMessage
  | ClearContextMessage;

export const CONDUCTOR_URL =
  typeof chrome !== "undefined" &&
  chrome.runtime?.getManifest?.()?.version_name === "development"
    ? "http://localhost:3000"
    : "https://conductor-lake.vercel.app";
