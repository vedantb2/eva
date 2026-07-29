"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { EntityResolveStatus } from "@/lib/components/EntityNumIdGate";
import { parseRouteNumId } from "@/lib/numId";

type ResolveResult<TId extends string> = {
  status: EntityResolveStatus;
  convexId: TId | null;
  numId: number | null;
};

function resolveEntity<TId extends string>(
  numIdParam: string | undefined,
  entity: { _id: TId } | null | undefined,
): ResolveResult<TId> {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;

  if (parsedNumId === null) {
    return { status: "not-found", convexId: null, numId: null };
  }
  if (entity === undefined) {
    return { status: "loading", convexId: null, numId: parsedNumId };
  }
  if (entity === null) {
    return { status: "not-found", convexId: null, numId: parsedNumId };
  }
  return { status: "ready", convexId: entity._id, numId: parsedNumId };
}

export function useSessionByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult<Id<"sessions">> {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const session = useQuery(
    api.sessions.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, session);
}

export function useProjectByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult<Id<"projects">> {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const project = useQuery(
    api.projects.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, project);
}

export function useAgentTaskByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult<Id<"agentTasks">> {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const task = useQuery(
    api.agentTasks.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, task);
}

export function useDesignSessionByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult<Id<"designSessions">> {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const designSession = useQuery(
    api.designSessions.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, designSession);
}
