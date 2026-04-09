"use client";

import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  getAIProviderAvailability,
  getVisibleAIModelOptions,
  normalizeAIModel,
  type Id,
} from "@conductor/backend";

export function useAvailableAiModels(
  repoId: Id<"githubRepos"> | null | undefined,
  currentModel?: string | null,
) {
  const repo = useQuery(api.githubRepos.get, repoId ? { id: repoId } : "skip");
  const repoEnvVars = useQuery(
    api.repoEnvVars.list,
    repoId ? { repoId } : "skip",
  );
  const teamEnvVars = useQuery(
    api.teamEnvVars.list,
    repo?.teamId ? { teamId: repo.teamId } : "skip",
  );

  const normalizedModel = normalizeAIModel(currentModel);
  const availability = useMemo(() => {
    if (repoEnvVars === undefined) {
      return undefined;
    }
    if (repo?.teamId && teamEnvVars === undefined) {
      return undefined;
    }

    const keys = new Set<string>();
    for (const entry of teamEnvVars ?? []) {
      keys.add(entry.key);
    }
    for (const entry of repoEnvVars) {
      keys.add(entry.key);
    }

    return getAIProviderAvailability(keys);
  }, [repo?.teamId, repoEnvVars, teamEnvVars]);

  const options = useMemo(
    () => getVisibleAIModelOptions(availability, normalizedModel),
    [availability, normalizedModel],
  );

  return {
    availability,
    options,
    model: normalizedModel,
  };
}
