import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

interface SessionOptionsMenuProps {
  sessionId: Id<"sessions">;
}

/**
 * Composer options for a session: toggle "Capture proof" and "Run audit". Both
 * persist on the session doc and apply to every subsequent turn until unchecked
 * (bound directly to Convex with an optimistic update — no local mirror).
 */
export function SessionOptionsMenu({ sessionId }: SessionOptionsMenuProps) {
  const session = useQuery(api.sessions.get, { id: sessionId });
  const updateSession = useMutation(api.sessions.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.sessions.get, { id: sessionId });
      if (!current) return;
      localStore.setQuery(
        api.sessions.get,
        { id: sessionId },
        {
          ...current,
          ...(args.captureProofEnabled !== undefined
            ? { captureProofEnabled: args.captureProofEnabled }
            : {}),
          ...(args.runAuditEnabled !== undefined
            ? { runAuditEnabled: args.runAuditEnabled }
            : {}),
        },
      );
    },
  );

  const captureProof = session?.captureProofEnabled ?? false;
  const runAudit = session?.runAuditEnabled ?? false;
  const anyOn = captureProof || runAudit;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors hover:bg-muted hover:text-foreground ${anyOn ? "text-foreground" : "text-muted-foreground"}`}
        >
          <IconAdjustmentsHorizontal className="size-3.5" />
          Options
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Run options</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={captureProof}
          onCheckedChange={(checked) =>
            updateSession({ id: sessionId, captureProofEnabled: checked })
          }
          onSelect={(e) => e.preventDefault()}
        >
          Capture proof
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={runAudit}
          onCheckedChange={(checked) =>
            updateSession({ id: sessionId, runAuditEnabled: checked })
          }
          onSelect={(e) => e.preventDefault()}
        >
          Run audit
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
