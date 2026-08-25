"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api, type Id } from "@eva/backend";
import { Button, Spinner, toast } from "@eva/ui";
import { IconRefresh } from "@tabler/icons-react";
import type { UsageAccountScope } from "./_utils";

/**
 * Why a refresh came back with nothing, in the user's terms. Each one names a
 * different next move, which is the only reason they are distinguished at all.
 */
const FAILURE_COPY: Record<string, string> = {
  "sandbox-idle": "Wake Eva to refresh plan usage.",
  unavailable: "Claude isn't reporting plan rate limits for this account.",
};

const GENERIC_FAILURE = "Couldn't refresh plan usage.";

/** The live daemon that will answer this refresh — one surface, never mixed. */
export type UsageRefreshTarget =
  | { sessionId: Id<"sessions"> }
  | { projectId: Id<"projects"> }
  | { taskId: Id<"agentTasks"> };

interface UsageRefreshButtonProps {
  repoId: Id<"githubRepos">;
  /** The credential to read. Refreshing is per account, like the reading. */
  scope: UsageAccountScope;
  target: UsageRefreshTarget;
}

function reportOutcome(result: { ok: boolean; reason?: string }): void {
  if (result.ok) return;
  const copy = FAILURE_COPY[result.reason ?? ""] ?? GENERIC_FAILURE;
  if (result.reason === "sandbox-idle") {
    toast(copy);
    return;
  }
  toast.error(copy);
}

/**
 * Pulls a reading now instead of waiting for the next turn to report one.
 *
 * Nothing is invalidated on success: `getByRepo` is a live query, so the card
 * the button sits in updates itself the moment the row is written.
 */
export function UsageRefreshButton({
  repoId,
  scope,
  target,
}: UsageRefreshButtonProps) {
  const refresh = useAction(api.usageLimitsActions.refresh);
  const [pending, setPending] = useState(false);

  const onRefresh = async () => {
    setPending(true);
    const accountId = scope.providerAccountId;
    const accountArg =
      accountId === null ? {} : { providerAccountId: accountId };
    try {
      const result = await refresh({
        repoId,
        provider: "claude",
        ...accountArg,
        ...target,
      });
      setPending(false);
      reportOutcome(result);
    } catch {
      // A server throw carries Convex internals (request id, stack), which is
      // not copy for a toast — every named failure already arrives as a reason.
      setPending(false);
      toast.error(GENERIC_FAILURE);
    }
  };

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="Refresh plan usage"
      disabled={pending}
      onClick={() => {
        void onRefresh();
      }}
    >
      {pending ? <Spinner size="sm" /> : <IconRefresh size={14} />}
    </Button>
  );
}
