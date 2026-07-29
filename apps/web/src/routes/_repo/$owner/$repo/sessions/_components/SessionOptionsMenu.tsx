import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@eva/ui";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";

interface SessionOptionsMenuProps {
  sessionId: Id<"sessions">;
}

/**
 * Session run options as a submenu for the composer "+" menu (Capture proof /
 * Run audit). Bound to Convex with optimistic updates — no local mirror.
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

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <IconAdjustmentsHorizontal className="mr-2 size-4" />
        Options
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
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
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
