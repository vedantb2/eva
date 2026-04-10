"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EnvVarsTable } from "@/lib/components/EnvVarsTable";

export function EnvVariablesClient() {
  const { repoId } = useRepo();
  const vars = useQuery(api.repoEnvVars.list, { repoId });
  const upsertVar = useAction(api.repoEnvVarsActions.upsertVar);
  const revealValue = useAction(api.repoEnvVarsActions.revealValue);
  const removeVar = useMutation(api.repoEnvVars.removeVar);
  const toggleSandboxExclude = useMutation(
    api.repoEnvVars.toggleSandboxExclude,
  );

  return (
    <EnvVarsTable
      vars={vars}
      onUpsert={async (key, value, sandboxExclude) => {
        await upsertVar({ repoId, key, value, sandboxExclude });
      }}
      onReveal={(key) => revealValue({ repoId, key })}
      onRemove={async (key) => {
        await removeVar({ repoId, key });
      }}
      onToggleSandboxExclude={async (key, sandboxExclude) => {
        await toggleSandboxExclude({ repoId, key, sandboxExclude });
      }}
      description="Repo-specific variables injected into sandboxes for this repository. Add CODEX_AUTH_JSON to enable Codex for this repo."
    />
  );
}
