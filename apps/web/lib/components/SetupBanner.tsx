"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@conductor/ui";
import { IconAlertTriangle } from "@tabler/icons-react";
import Link from "next/link";

const REQUIRED_KEYS: Array<{
  key: string;
  required: boolean;
  description: string;
}> = [
  {
    key: "CLAUDE_CODE_OAUTH_TOKEN",
    required: true,
    description: "OAuth token for Claude Code CLI authentication in sandboxes",
  },
  {
    key: "DAYTONA_API_KEY",
    required: true,
    description: "API key for provisioning and managing Daytona sandboxes",
  },
];

export function SetupBanner() {
  const { repo } = useRepo();
  const [dismissed, setDismissed] = useState(false);

  const team = useQuery(
    api.teams.get,
    repo.teamId ? { id: repo.teamId } : "skip",
  );

  const teamEnvVars = useQuery(
    api.teamEnvVars.list,
    repo.teamId ? { teamId: repo.teamId } : "skip",
  );

  const repoEnvVars = useQuery(api.repoEnvVars.list, { repoId: repo._id });

  if (!repo.teamId || !team) {
    return null;
  }

  if (teamEnvVars === undefined || repoEnvVars === undefined) {
    return null;
  }

  const allEnvVars = [...teamEnvVars, ...repoEnvVars];
  const presentKeys = new Set(allEnvVars.map((v) => v.key));
  const missingEntries = REQUIRED_KEYS.filter(
    (entry) => !presentKeys.has(entry.key),
  );
  const hasRequiredMissing = missingEntries.some((entry) => entry.required);

  if (!hasRequiredMissing || dismissed) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setDismissed(true)}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
              <IconAlertTriangle
                size={20}
                className="text-yellow-600 dark:text-yellow-500"
              />
            </div>
            <DialogTitle>Setup Required</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To use sandboxes and AI features, you need to configure the
            following environment variables in your team or repo settings.
          </p>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Missing Variables:
            </p>
            <div className="flex flex-col gap-2">
              {missingEntries.map((entry) => (
                <div key={entry.key} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-background px-2 py-1 font-mono text-sm">
                      {entry.key}
                    </code>
                    {entry.required ? (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                        Required
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-500">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="pl-2 text-xs text-muted-foreground">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
          <Link href={`/teams/${team._id}`}>
            <Button>Configure Team Settings</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
