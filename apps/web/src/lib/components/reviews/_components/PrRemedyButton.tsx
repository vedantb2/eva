"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { Button, Spinner, toast } from "@eva/ui";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { PrRemedy } from "./prMergeState";

/**
 * Turns a merge blocker into work. Conflicts and a stale branch are both ordinary
 * agent tasks, and eva already knows how to run one on a branch — so rather than
 * reporting GitHub's verdict and stopping, the header offers a session started on
 * the head branch with the fix already asked for.
 *
 * The session opens on `headRef`, not the base: the work has to land on the branch
 * the pull request is built from.
 */
export function PrRemedyButton({
  remedy,
  headRef,
}: {
  remedy: PrRemedy;
  headRef: string;
}) {
  const navigate = useNavigate();
  const { repoId, basePath } = useRepo();
  const createSession = useMutation(api.sessions.create);
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      const { numId } = await createSession({
        repoId,
        title: remedy.sessionTitle,
        message: remedy.prompt,
        baseBranch: headRef,
      });
      await navigate({ to: `${basePath}/sessions/${numId}` });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't start a session",
      );
      setStarting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={starting}
      onClick={() => void start()}
      className="shrink-0 text-xs"
    >
      {starting ? <Spinner size="sm" /> : null}
      {remedy.action}
      {starting ? null : <IconArrowUpRight size={13} aria-hidden />}
    </Button>
  );
}
