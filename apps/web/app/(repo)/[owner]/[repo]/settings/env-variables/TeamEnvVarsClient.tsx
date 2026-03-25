"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { Card, CardContent } from "@conductor/ui";
import { useRouter } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EnvVarsTable } from "@/lib/components/EnvVarsTable";

export function TeamEnvVarsClient() {
  const router = useRouter();
  const { repo } = useRepo();

  const team = useQuery(
    api.teams.get,
    repo.teamId ? { id: repo.teamId } : "skip",
  );

  const teamEnvVars = useQuery(
    api.teamEnvVars.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );

  const upsertTeamVar = useAction(api.teamEnvVarsActions.upsertVar);
  const revealTeamValue = useAction(api.teamEnvVarsActions.revealValue);
  const removeTeamVar = useMutation(api.teamEnvVars.removeVar);
  const toggleSandboxExclude = useMutation(
    api.teamEnvVars.toggleSandboxExclude,
  );

  if (!repo.teamId || !team) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconUsers size={48} className="mb-4 text-muted-foreground/50" />
          <p className="mb-2 text-sm font-medium">No team configured</p>
          <p className="text-xs text-muted-foreground">
            This repository is not part of any team yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <EnvVarsTable
        vars={teamEnvVars}
        description="Team-level variables inherited by all repositories in this team."
        onUpsert={async (key, value, sandboxExclude) => {
          if (!repo.teamId) return;
          await upsertTeamVar({
            teamId: repo.teamId,
            key,
            value,
            sandboxExclude,
          });
        }}
        onReveal={async (key) => {
          if (!repo.teamId) return null;
          return await revealTeamValue({ teamId: repo.teamId, key });
        }}
        onRemove={async (key) => {
          if (!repo.teamId) return;
          await removeTeamVar({ teamId: repo.teamId, key });
        }}
        onToggleSandboxExclude={async (key, sandboxExclude) => {
          if (!repo.teamId) return;
          await toggleSandboxExclude({
            teamId: repo.teamId,
            key,
            sandboxExclude,
          });
        }}
      />
      <div className="flex items-center gap-2">
        <IconUsers size={16} className="text-muted-foreground" />
        <p className="text-sm">
          Team:{" "}
          <span className="font-medium">{team.displayName ?? team.name}</span>
        </p>
        <span className="text-muted-foreground">•</span>
        <span
          onClick={() => window.open(`/teams/${team._id}`, "_blank")}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Manage team variables →
        </span>
      </div>
    </div>
  );
}
