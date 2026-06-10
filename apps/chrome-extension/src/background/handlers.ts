import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type {
  BgResult,
  BgError,
  StoredPin,
  TaskStatus,
} from "../shared/messaging";
import { isTaskId, isProjectId, isTaskStatus } from "../shared/messaging";
import {
  buildPinDescription,
  buildContextDescription,
} from "../shared/task-description";
import type { ExtractedContext } from "../shared/types";
import { getAuthedClient, getClerkUser, NotSignedInError } from "./convex";
import { resolveRepoForUrl, NoRepoMatchError } from "./repo-matching";

function bgError(code: BgError["code"], message: string): BgError {
  return { ok: false, code, message };
}

async function withAuth<T extends Record<string, unknown>>(
  fn: () => Promise<T>,
): Promise<BgResult<T>> {
  try {
    const result = await fn();
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof NotSignedInError) {
      return bgError("not_signed_in", "Sign in to Eva to use this feature");
    }
    if (e instanceof NoRepoMatchError) {
      return bgError("no_repo_match", e.message);
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return bgError("convex_error", msg);
  }
}

async function getCreatorInitials(): Promise<string> {
  const user = await getClerkUser();
  if (!user) return "?";
  return (
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?"
  );
}

// ---------- handlers ----------

export async function loadAnnotations(payload: {
  pageUrl: string;
}): Promise<BgResult<{ pins: Record<string, StoredPin> }>> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const raw = await client.query(api.annotations.getByUrl, {
      pageUrl: payload.pageUrl,
    });
    const pins: Record<string, StoredPin> = raw ? JSON.parse(raw) : {};
    return { pins };
  });
}

export async function saveAnnotations(payload: {
  pageUrl: string;
  pins: Record<string, StoredPin>;
}): Promise<BgResult> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const hasEntries = Object.keys(payload.pins).length > 0;
    if (hasEntries) {
      await client.mutation(api.annotations.save, {
        pageUrl: payload.pageUrl,
        pins: JSON.stringify(payload.pins),
      });
    } else {
      await client.mutation(api.annotations.remove, {
        pageUrl: payload.pageUrl,
      });
    }
    return {};
  });
}

export async function createAnnotationTask(payload: {
  pageUrl: string;
  title: string;
  pinId: string;
  elementContext?: ExtractedContext;
}): Promise<
  BgResult<{
    pinId: string;
    taskId: string;
    userId?: string;
    creatorInitials?: string;
  }>
> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const { repoId } = await resolveRepoForUrl(client, payload.pageUrl);
    const description = buildContextDescription(
      payload.title,
      payload.pageUrl,
      payload.elementContext,
    );
    const taskId = await client.mutation(api.agentTasks.createQuickTask, {
      repoId,
      title: payload.title.slice(0, 100),
      description,
    });
    const userId = await client.query(api.auth.me, {});
    const initials = await getCreatorInitials();
    return {
      pinId: payload.pinId,
      taskId: String(taskId),
      userId: userId ? String(userId) : undefined,
      creatorInitials: initials,
    };
  });
}

export async function runAnnotationTask(payload: {
  taskId: string;
}): Promise<BgResult> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    if (isTaskId(payload.taskId)) {
      await client.mutation(api.agentTasks.startExecution, {
        id: payload.taskId,
      });
    }
    return {};
  });
}

export async function runAllAnnotations(payload: {
  pageUrl: string;
  pins: Record<string, StoredPin>;
}): Promise<
  BgResult<{
    created: Array<{ pinId: string; taskId: string }>;
    userId?: string;
    creatorInitials?: string;
    message: string;
  }>
> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const { repoId } = await resolveRepoForUrl(client, payload.pageUrl);
    const userId = await client.query(api.auth.me, {});
    const initials = await getCreatorInitials();
    const created: Array<{ pinId: string; taskId: string }> = [];

    for (const [pinId, pin] of Object.entries(payload.pins)) {
      try {
        const title = pin.text.slice(0, 100) || `Annotation #${pin.number}`;
        const description = buildPinDescription(pin, payload.pageUrl);
        const taskId = await client.mutation(api.agentTasks.createQuickTask, {
          repoId,
          title,
          description,
        });
        await client.mutation(api.agentTasks.startExecution, { id: taskId });
        created.push({ pinId, taskId: String(taskId) });
      } catch (e) {
        console.error(`Failed to run annotation task for pin ${pinId}:`, e);
      }
    }

    const count = created.length;
    return {
      created,
      userId: userId ? String(userId) : undefined,
      creatorInitials: initials,
      message: `Created & running ${count} task${count !== 1 ? "s" : ""}`,
    };
  });
}

export async function listProjects(payload: { pageUrl: string }): Promise<
  BgResult<{
    projects: Array<{ id: string; title: string; phase: string }>;
  }>
> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const { repoId } = await resolveRepoForUrl(client, payload.pageUrl);
    const rawProjects = await client.query(api.projects.list, { repoId });
    const projects = rawProjects.map((p) => ({
      id: String(p._id),
      title: p.title,
      phase: p.phase,
    }));
    return { projects };
  });
}

export async function addToProject(payload: {
  pageUrl: string;
  pins: Record<string, StoredPin>;
  target:
    | { kind: "existing"; projectId: string }
    | { kind: "new"; title: string };
}): Promise<BgResult<{ count: number; message: string }>> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const { repoId } = await resolveRepoForUrl(client, payload.pageUrl);
    const taskIds: Id<"agentTasks">[] = [];

    for (const pin of Object.values(payload.pins)) {
      try {
        const title = pin.text.slice(0, 100) || `Annotation #${pin.number}`;
        const description = buildPinDescription(pin, payload.pageUrl);
        const id = await client.mutation(api.agentTasks.createQuickTask, {
          repoId,
          title,
          description,
        });
        taskIds.push(id);
      } catch (e) {
        console.error("Failed to create task:", e);
      }
    }

    if (taskIds.length > 0) {
      if (payload.target.kind === "existing") {
        const pid = payload.target.projectId;
        if (isProjectId(pid)) {
          await client.mutation(api.agentTasks.assignToProject, {
            taskIds,
            projectId: pid,
          });
        }
      } else if (payload.target.kind === "new" && payload.target.title.trim()) {
        await client.mutation(api.projects.createFromTasks, {
          repoId,
          title: payload.target.title.trim(),
          taskIds,
        });
      }
    }

    const count = taskIds.length;
    return {
      count,
      message: `Added ${count} task${count !== 1 ? "s" : ""} to project`,
    };
  });
}

export async function syncTaskStatuses(payload: {
  taskIds: string[];
}): Promise<BgResult<{ updates: Record<string, { status: TaskStatus }> }>> {
  return withAuth(async () => {
    const client = await getAuthedClient();
    const ids = payload.taskIds.filter(isTaskId);
    if (ids.length === 0) return { updates: {} };
    const results = await client.query(api.agentTasks.getStatusesByIds, {
      ids,
    });
    const updates: Record<string, { status: TaskStatus }> = {};
    for (const { id, status } of results) {
      if (isTaskStatus(status)) {
        updates[String(id)] = { status };
      }
    }
    return { updates };
  });
}

export function openEva(payload: { path?: string }): { ok: true } {
  const base = import.meta.env.VITE_EVA_URL;
  const url = payload.path ? `${base}${payload.path}` : String(base);
  chrome.tabs.create({ url });
  return { ok: true };
}
