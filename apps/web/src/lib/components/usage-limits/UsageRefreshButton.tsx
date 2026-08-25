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
  "no-token": "This account has no Claude OAuth token connected.",
  unauthorized: "Claude rejected the token. Reconnect the account in Settings.",
  unavailable: "Claude isn't reporting plan rate limits for this account.",
  network: "Couldn't reach Claude. Try again.",
};

const GENERIC_FAILURE = "Couldn't refresh plan usage.";

interface UsageRefreshButtonProps {
  repoId: Id<"githubRepos">;
  /** The credential to read. Refreshing is per account, like the reading. */
  scope: UsageAccountScope;
}

function reportOutcome(result: { ok: boolean; reason?: string }): void {
  if (result.ok) return;
  const copy = FAILURE_COPY[result.reason ?? ""];
  toast.error(copy ?? GENERIC_FAILURE);
}

/**
 * Pulls a reading now instead of waiting for the next turn to report one.
 *
 * Nothing is invalidated on success: `getByRepo` is a live query, so the card
 * the button sits in updates itself the moment the row is written.
 */
export function UsageRefreshButton({ repoId, scope }: UsageRefreshButtonProps) {
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
      });
      setPending(false);
      reportOutcome(result);
    } catch (error) {
      setPending(false);
      toast.error(error instanceof Error ? error.message : GENERIC_FAILURE);
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
