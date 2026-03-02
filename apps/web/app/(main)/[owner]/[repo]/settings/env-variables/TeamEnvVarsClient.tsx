"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { Card, CardContent } from "@conductor/ui";
import Link from "next/link";
import { IconUsers } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EnvVarsTable } from "@/lib/components/EnvVarsTable";

export function TeamEnvVarsClient() {
  const { repo } = useRepo();

  const team = useQuery(
    api.teams.get,
    repo.teamId ? { id: repo.teamId } : "skip",
  );

  const teamEnvVars = useQuery(
    api.teamEnvVars.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );

  const revealTeamValue = useAction(api.teamEnvVarsActions.revealValue);

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
        description="Environment variables inherited from the team this repository belongs to (read-only)"
        readOnly
        onReveal={async (key) => {
          if (!repo.teamId) return null;
          return await revealTeamValue({ teamId: repo.teamId, key });
        }}
      />
      <div className="flex items-center gap-2">
        <IconUsers size={16} className="text-muted-foreground" />
        <p className="text-sm">
          Team: <span className="font-medium">{team.name}</span>
        </p>
        <span className="text-muted-foreground">•</span>
        <Link
          href={`/teams/${team._id}`}
          className="text-sm text-primary hover:underline"
        >
          Manage team variables →
        </Link>
      </div>
    </div>
  );
}
