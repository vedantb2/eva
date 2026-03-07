"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EnvVarsTable } from "@/lib/components/EnvVarsTable";

export function EnvVariablesClient() {
  const { repoId } = useRepo();
  const vars = useQuery(api.repoEnvVars.list, { repoId });
  const upsertVar = useAction(api.repoEnvVarsActions.upsertVar);
  const revealValue = useAction(api.repoEnvVarsActions.revealValue);
  const removeVar = useMutation(api.repoEnvVars.removeVar);

  return (
    <EnvVarsTable
      vars={vars}
      onUpsert={async (key, value) => {
        await upsertVar({ repoId, key, value });
      }}
      onReveal={(key) => revealValue({ repoId, key })}
      onRemove={async (key) => {
        await removeVar({ repoId, key });
      }}
      description="Repo-specific variables injected into sandboxes for this repository."
    />
  );
}
