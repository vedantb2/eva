"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { EntityResolveStatus } from "@/lib/components/EntityNumIdGate";
import { parseRouteNumId } from "@/lib/numId";

type ResolveResult = {
  status: EntityResolveStatus;
  convexId: string | null;
  numId: number | null;
};

function resolveEntity(
  numIdParam: string | undefined,
  entity: { _id: string } | null | undefined,
): ResolveResult {
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

export function combineResolveStatuses(
  first: EntityResolveStatus,
  second: EntityResolveStatus,
): EntityResolveStatus {
  if (first === "loading" || second === "loading") {
    return "loading";
  }
  if (first === "not-found" || second === "not-found") {
    return "not-found";
  }
  return "ready";
}

export function useSessionByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const session = useQuery(
    api.sessions.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, session);
}

export function useDocByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const doc = useQuery(
    api.docs.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, doc);
}

export function useProjectByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult {
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
): ResolveResult {
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
): ResolveResult {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const designSession = useQuery(
    api.designSessions.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, designSession);
}

export function useAutomationByNumId(
  numIdParam: string | undefined,
  repoId: Id<"githubRepos">,
): ResolveResult {
  const parsedNumId =
    numIdParam !== undefined ? parseRouteNumId(numIdParam) : null;
  const automation = useQuery(
    api.automations.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(numIdParam, automation);
}
