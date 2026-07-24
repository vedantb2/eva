"use client";

import { useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { entityPathSegment } from "@/lib/numId";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

/**
 * Navigates to a Data `@` mention target (document / session / project /
 * quick task) using `mentions.getEntity` to resolve kind + numId.
 */
export function useDataMentionNavigate(
  repoBasePath: string,
  repoId: Id<"githubRepos">,
) {
  const navigate = useNavigate();
  const convex = useConvex();

  return async (entityId: string) => {
    const entity = await convex.query(api.mentions.getEntity, {
      id: entityId,
      repoId,
    });
    if (!entity) return;

    const segment =
      entity.numId !== undefined
        ? entityPathSegment({ numId: entity.numId })
        : null;
    if (!segment) return;

    if (entity.kind === "document") {
      navigate({
        to: `${repoBasePath}/docs/${segment}/${DOC_VIEWER_DEFAULT_TAB}`,
      });
      return;
    }
    if (entity.kind === "session") {
      navigate({ to: `${repoBasePath}/sessions/${segment}` });
      return;
    }
    if (entity.kind === "project") {
      navigate({ to: `${repoBasePath}/projects/${segment}` });
      return;
    }
    navigate({ to: `${repoBasePath}/quick-tasks/${segment}` });
  };
}
