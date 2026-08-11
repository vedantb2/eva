"use client";

import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id, ReasoningLevel, StoredModelTraits } from "@eva/backend";
import { toRunTraitArgs } from "@/lib/utils/runTraits";

/** The sticky trait fields as they are stored on a project. */
interface ProjectStickyTraits {
  lastReasoningLevel?: ReasoningLevel;
  lastThinkingEnabled?: boolean;
  lastUse1mContext?: boolean;
  lastFastMode?: boolean;
}

/**
 * Project traits in the shape the traits menu reads. A project has one trait
 * set (`last*`), shared by the sandbox chat composer and the Overview model
 * row, so the two surfaces cannot show different reasoning or context.
 */
export function projectStoredTraits(
  project: ProjectStickyTraits | undefined | null,
): StoredModelTraits {
  return {
    effortLevel: project?.lastReasoningLevel,
    thinkingEnabled: project?.lastThinkingEnabled,
    use1mContext: project?.lastUse1mContext,
    fastMode: project?.lastFastMode,
  };
}

/**
 * `projects.setTraits` with an optimistic patch of `projects.get`, so a trait
 * pick shows in the menu without waiting for the round trip.
 */
export function useSetProjectTraits(projectId: Id<"projects">) {
  const setTraits = useMutation(api.projects.setTraits).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.projects.get, { id: projectId });
      if (current === undefined || current === null) return;
      localStore.setQuery(
        api.projects.get,
        { id: projectId },
        {
          ...current,
          ...(args.reasoningLevel !== undefined
            ? { lastReasoningLevel: args.reasoningLevel }
            : {}),
          ...(args.thinkingEnabled !== undefined
            ? { lastThinkingEnabled: args.thinkingEnabled }
            : {}),
          ...(args.use1mContext !== undefined
            ? { lastUse1mContext: args.use1mContext }
            : {}),
          ...(args.fastMode !== undefined
            ? { lastFastMode: args.fastMode }
            : {}),
        },
      );
    },
  );

  return (partial: StoredModelTraits) => {
    void setTraits({ id: projectId, ...toRunTraitArgs(partial) });
  };
}
