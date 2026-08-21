"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRouterState } from "@tanstack/react-router";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionArgs } from "convex/server";
import {
  parseRouteNumId,
  replaceRouteIdSegment,
  type EntityResolveResult,
} from "@/lib/numId";

/** Derived from the query args so the entity list has one source of truth. */
type RepoEntityType = FunctionArgs<
  typeof api.legacyIds.resolveNumId
>["entityType"];

/** `none` means the param is a normal numId and the legacy lookup never ran. */
type LegacyRedirect =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "redirect"; to: string };

/**
 * Handles the pre-numId URL shape: a param that is not a positive integer is
 * treated as a Convex document id, looked up once, and turned into the
 * canonical numId path. Skips entirely for normal numId params.
 */
function useLegacyRedirect(
  param: string | undefined,
  repoId: Id<"githubRepos">,
  entityType: RepoEntityType,
): LegacyRedirect {
  const legacyDocId =
    param !== undefined && parseRouteNumId(param) === null ? param : undefined;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const numId = useQuery(
    api.legacyIds.resolveNumId,
    legacyDocId !== undefined
      ? { repoId, entityType, docId: legacyDocId }
      : "skip",
  );

  if (legacyDocId === undefined) return { kind: "none" };
  if (numId === undefined) return { kind: "loading" };
  if (numId === null) return { kind: "not-found" };
  return {
    kind: "redirect",
    to: replaceRouteIdSegment(pathname, legacyDocId, numId),
  };
}

function resolveEntity<TDoc extends { _id: string }>(
  param: string | undefined,
  doc: TDoc | null | undefined,
  legacy: LegacyRedirect,
): EntityResolveResult<TDoc> {
  const parsedNumId = param !== undefined ? parseRouteNumId(param) : null;

  if (legacy.kind !== "none") {
    return {
      status: legacy.kind === "not-found" ? "not-found" : "loading",
      doc: null,
      convexId: null,
      numId: null,
      redirectTo: legacy.kind === "redirect" ? legacy.to : null,
    };
  }
  if (parsedNumId === null) {
    return {
      status: "not-found",
      doc: null,
      convexId: null,
      numId: null,
      redirectTo: null,
    };
  }
  if (doc === undefined) {
    return {
      status: "loading",
      doc: null,
      convexId: null,
      numId: parsedNumId,
      redirectTo: null,
    };
  }
  if (doc === null) {
    return {
      status: "not-found",
      doc: null,
      convexId: null,
      numId: parsedNumId,
      redirectTo: null,
    };
  }
  return {
    status: "ready",
    doc,
    convexId: doc._id,
    numId: parsedNumId,
    redirectTo: null,
  };
}

export function useSessionByNumId(
  param: string | undefined,
  repoId: Id<"githubRepos">,
) {
  const parsedNumId = param !== undefined ? parseRouteNumId(param) : null;
  const legacy = useLegacyRedirect(param, repoId, "sessions");
  const session = useQuery(
    api.sessions.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(param, session, legacy);
}

export function useProjectByNumId(
  param: string | undefined,
  repoId: Id<"githubRepos">,
) {
  const parsedNumId = param !== undefined ? parseRouteNumId(param) : null;
  const legacy = useLegacyRedirect(param, repoId, "projects");
  const project = useQuery(
    api.projects.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(param, project, legacy);
}

export function useAgentTaskByNumId(
  param: string | undefined,
  repoId: Id<"githubRepos">,
) {
  const parsedNumId = param !== undefined ? parseRouteNumId(param) : null;
  const legacy = useLegacyRedirect(param, repoId, "agentTasks");
  const task = useQuery(
    api.agentTasks.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(param, task, legacy);
}

export function useDocByNumId(
  param: string | undefined,
  repoId: Id<"githubRepos">,
) {
  const parsedNumId = param !== undefined ? parseRouteNumId(param) : null;
  const legacy = useLegacyRedirect(param, repoId, "docs");
  const doc = useQuery(
    api.docs.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(param, doc, legacy);
}

export function useAutomationByNumId(
  param: string | undefined,
  repoId: Id<"githubRepos">,
) {
  const parsedNumId = param !== undefined ? parseRouteNumId(param) : null;
  const legacy = useLegacyRedirect(param, repoId, "automations");
  const automation = useQuery(
    api.automations.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  return resolveEntity(param, automation, legacy);
}
