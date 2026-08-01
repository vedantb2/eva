import { useQuery } from "convex-helpers/react/cache/hooks";
import type { ModelAccount } from "@eva/ui";
import { useState } from "react";
import {
  api,
  getAIModelProvider,
  getVisibleAIModelOptions,
  normalizeAIModel,
  type Id,
} from "@eva/backend";

function includesModel(models: ReadonlyArray<string>, model: string): boolean {
  return models.includes(model);
}

export function useAvailableAiModels(
  repoId: Id<"githubRepos"> | null | undefined,
  currentModel?: string | null,
  providerAccountId?: Id<"userProviderAccounts"> | null,
) {
  const [capabilityQueryTime] = useState(() => Date.now());
  const availability = useQuery(
    api.githubRepos.getProviderAvailability,
    repoId ? { repoId } : "skip",
  );

  const normalizedModel = normalizeAIModel(currentModel);
  const cursorCapabilities = useQuery(
    api.providerCapabilities.getCursor,
    repoId && getAIModelProvider(normalizedModel) === "cursor"
      ? {
          repoId,
          model: normalizedModel,
          now: capabilityQueryTime,
          ...(providerAccountId ? { providerAccountId } : {}),
        }
      : "skip",
  );
  const visibleOptions = getVisibleAIModelOptions(
    availability,
    normalizedModel,
  );
  const options = visibleOptions.map((option) =>
    cursorCapabilities &&
    option.provider === "cursor" &&
    !includesModel(cursorCapabilities.availableModels, option.id)
      ? {
          ...option,
          disabledReason:
            "Unavailable for this Cursor account and CLI version.",
        }
      : option,
  );

  return {
    availability,
    options,
    model: normalizedModel,
    providerCapabilities: cursorCapabilities?.controls,
    cursorCapabilities,
  };
}

/**
 * The current user's provider accounts for the model picker.
 *
 * `options` are the picker's account groups (empty while loading or when none
 * exist, so the picker falls back to team-only). `resolveId` maps a stored
 * string id (the picker/localStorage carries plain strings) back to the branded
 * `Id<"userProviderAccounts">` from the live docs, so callers pass a properly
 * typed id to mutations without a cast. Unknown ids (e.g. a deleted account)
 * resolve to undefined — the run falls back to the team credential.
 */
function toModelAccounts(
  accounts:
    | ReadonlyArray<{
        _id: Id<"userProviderAccounts">;
        provider: ModelAccount["provider"];
        label: string;
        updatedAt: number;
      }>
    | undefined,
): {
  options: ReadonlyArray<ModelAccount>;
  resolveId: (id: string | null) => Id<"userProviderAccounts"> | undefined;
  ready: boolean;
} {
  // Most recently updated first so create-time defaults prefer the latest.
  const sorted = (accounts ?? []).toSorted((a, b) => b.updatedAt - a.updatedAt);
  const options: ReadonlyArray<ModelAccount> = sorted.map((account) => ({
    id: account._id,
    provider: account.provider,
    label: account.label,
  }));
  const resolveId = (
    id: string | null,
  ): Id<"userProviderAccounts"> | undefined =>
    id ? accounts?.find((account) => account._id === id)?._id : undefined;
  return { options, resolveId, ready: accounts !== undefined };
}

export function useProviderAccounts(): {
  options: ReadonlyArray<ModelAccount>;
  resolveId: (id: string | null) => Id<"userProviderAccounts"> | undefined;
  ready: boolean;
} {
  const accounts = useQuery(api.userProviderAccounts.list, {});
  return toModelAccounts(accounts);
}

/**
 * Task owner's personal accounts for the model picker (same shape as
 * `useProviderAccounts`). Used so teammates see the sticky owner's groups.
 */
export function useTaskOwnerProviderAccounts(
  taskId: Id<"agentTasks"> | null | undefined,
): {
  options: ReadonlyArray<ModelAccount>;
  resolveId: (id: string | null) => Id<"userProviderAccounts"> | undefined;
  ready: boolean;
} {
  const accounts = useQuery(
    api.userProviderAccounts.listForTaskOwner,
    taskId ? { taskId } : "skip",
  );
  return toModelAccounts(accounts);
}
