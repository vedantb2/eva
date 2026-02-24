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

  if (!repo.teamId || !team) {
    return null;
  }

  if (teamEnvVars === undefined) {
    return null;
  }

  const hasOAuthToken = teamEnvVars.some(
    (v) => v.key === "CLAUDE_CODE_OAUTH_TOKEN",
  );

  if (hasOAuthToken || dismissed) {
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
            <DialogTitle>OAuth Setup Required</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To use sandboxes and AI features, you need to configure your Claude
            Code OAuth token in your team's environment variables.
          </p>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Required Variable:
            </p>
            <code className="rounded bg-background px-2 py-1 font-mono text-sm">
              CLAUDE_CODE_OAUTH_TOKEN
            </code>
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
