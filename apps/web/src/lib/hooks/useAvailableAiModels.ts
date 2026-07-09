"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  getVisibleAIModelOptions,
  normalizeAIModel,
  type Id,
} from "@conductor/backend";

export function useAvailableAiModels(
  repoId: Id<"githubRepos"> | null | undefined,
  currentModel?: string | null,
) {
  const availability = useQuery(
    api.githubRepos.getProviderAvailability,
    repoId ? { repoId } : "skip",
  );

  const normalizedModel = normalizeAIModel(currentModel);
  const options = getVisibleAIModelOptions(availability, normalizedModel);

  return {
    availability,
    options,
    model: normalizedModel,
  };
}
