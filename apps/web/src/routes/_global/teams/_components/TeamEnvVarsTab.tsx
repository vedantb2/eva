import { useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { EnvVarsTable } from "@/lib/components/EnvVarsTable";

type TeamEnvVars = FunctionReturnType<typeof api.teamEnvVars.list>;

interface TeamEnvVarsTabProps {
  teamId: Id<"teams">;
  teamEnvVars: TeamEnvVars | undefined;
}

export function TeamEnvVarsTab({ teamId, teamEnvVars }: TeamEnvVarsTabProps) {
  const upsertTeamVar = useAction(api.teamEnvVarsActions.upsertVar);
  const revealTeamValue = useAction(api.teamEnvVarsActions.revealValue);
  const removeTeamVar = useMutation(api.teamEnvVars.removeVar);
  const toggleSandboxExclude = useMutation(
    api.teamEnvVars.toggleSandboxExclude,
  );

  return (
    <EnvVarsTable
      vars={teamEnvVars}
      onUpsert={async (key, value, sandboxExclude) => {
        await upsertTeamVar({ teamId, key, value, sandboxExclude });
      }}
      onReveal={(key) => revealTeamValue({ teamId, key })}
      onRemove={async (key) => {
        await removeTeamVar({ teamId, key });
      }}
      onToggleSandboxExclude={async (key, sandboxExclude) => {
        await toggleSandboxExclude({ teamId, key, sandboxExclude });
      }}
      description="Team-level variables inherited by all codebases in this team. Add CODEX_AUTH_JSON here to enable Codex across the team."
    />
  );
}
