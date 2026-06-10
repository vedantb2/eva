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

export const EVA_URL: string = import.meta.env.VITE_EVA_URL;

export function isRepoId(value: string): value is Id<"githubRepos"> {
  return value.length > 0;
}

export function isTaskId(value: string): value is Id<"agentTasks"> {
  return value.length > 0;
}

export function isProjectId(value: string): value is Id<"projects"> {
  return value.length > 0;
}

const TASK_STATUSES: ReadonlySet<string> = new Set<string>([
  "draft",
  "todo",
  "in_progress",
  "code_review",
  "business_review",
  "done",
  "cancelled",
]);

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.has(value);
}

// ---------- runtime guards ----------

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStoredPinRecord(
  value: unknown,
): value is Record<string, StoredPin> {
  if (!isRecord(value)) return false;
  for (const v of Object.values(value)) {
    if (!isRecord(v) || typeof v.x !== "number" || typeof v.y !== "number")
      return false;
  }
  return true;
}

// ---------- error types ----------

export type BgErrorCode = "not_signed_in" | "no_repo_match" | "convex_error";

export interface BgError {
  ok: false;
  code: BgErrorCode;
  message: string;
}

export interface BgOk {
  ok: true;
}

export type BgResult<T = Record<never, never>> = (BgOk & T) | BgError;

// ---------- request / response map ----------

export interface BgRequestMap {
  GET_TOOLBAR_VISIBILITY: {
    request: Record<string, never>;
    response: { visible: boolean };
  };
  LOAD_ANNOTATIONS: {
    request: { pageUrl: string };
    response: BgResult<{ pins: Record<string, StoredPin> }>;
  };
  SAVE_ANNOTATIONS: {
    request: { pageUrl: string; pins: Record<string, StoredPin> };
    response: BgResult;
  };
  CREATE_ANNOTATION_TASK: {
    request: {
      pageUrl: string;
      title: string;
      pinId: string;
      elementContext?: ExtractedContext;
    };
    response: BgResult<{
      pinId: string;
      taskId: string;
      userId?: string;
      creatorInitials?: string;
    }>;
  };
  RUN_ANNOTATION_TASK: {
    request: { taskId: string };
    response: BgResult;
  };
  RUN_ALL_ANNOTATIONS: {
    request: { pageUrl: string; pins: Record<string, StoredPin> };
    response: BgResult<{
      created: Array<{ pinId: string; taskId: string }>;
      userId?: string;
      creatorInitials?: string;
      message: string;
    }>;
  };
  LIST_PROJECTS: {
    request: { pageUrl: string };
    response: BgResult<{
      projects: Array<{ id: string; title: string; phase: string }>;
    }>;
  };
  ADD_TO_PROJECT: {
    request: {
      pageUrl: string;
      pins: Record<string, StoredPin>;
      target:
        | { kind: "existing"; projectId: string }
        | { kind: "new"; title: string };
    };
    response: BgResult<{ count: number; message: string }>;
  };
  SYNC_TASK_STATUSES: {
    request: { taskIds: string[] };
    response: BgResult<{
      updates: Record<string, { status: TaskStatus }>;
    }>;
  };
  OPEN_EVA: {
    request: { path?: string };
    response: { ok: true };
  };
}

export type BgRequestType = keyof BgRequestMap;

// ---------- push messages (background → content) ----------

export interface ToolbarVisibilityChangedMessage {
  type: "TOOLBAR_VISIBILITY_CHANGED";
  visible: boolean;
}

export type PushMessage = ToolbarVisibilityChangedMessage;

// ---------- typed request helper ----------

// chrome.runtime.sendMessage returns untyped data; we validate via isRecord at call sites
export function requestBackground<T extends BgRequestType>(
  type: T,
  payload: BgRequestMap[T]["request"],
): Promise<BgRequestMap[T]["response"]> {
  type R = BgRequestMap[T]["response"];
  return new Promise<R>((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response: R) => {
      resolve(response);
    });
  });
}
