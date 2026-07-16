"use client";

import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import { RepoLogo } from "@/lib/components/RepoLogo";
import {
  appLeafName,
  appMatchesLabel,
  type RepoWithLogo,
} from "@/lib/utils/repoGrouping";

const TILE_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
];

/** Deterministic tile colour so logo-less repos stay visually distinguishable. */
function tileColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % TILE_PALETTE.length;
  }
  return TILE_PALETTE[hash];
}

interface RepoRailProps {
  repos: RepoWithLogo[];
  currentOwner: string | null;
  currentName: string | null;
  currentAppName: string | undefined;
  onSelect: (owner: string, name: string, rootDirectory?: string) => void;
}

/** Whether a repo row (root repo or monorepo app) matches the active URL. */
function isRowActive(
  row: RepoWithLogo,
  owner: string | null,
  name: string | null,
  appName: string | undefined,
): boolean {
  if (row.owner !== owner || row.name !== name) return false;
  if (row.rootDirectory) {
    return appName !== undefined && appMatchesLabel(row, appName);
  }
  return appName === undefined;
}

/**
 * Far-left icon rail: one icon per repo/app row. Clicking switches the active
 * repo/app (preserving the current sub-page via the parent's onSelect). Always
 * visible; the active row is chipped, others dim until hovered.
 */
export function RepoRail({
  repos,
  currentOwner,
  currentName,
  currentAppName,
  onSelect,
}: RepoRailProps) {
  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar">
      <div className="scrollbar flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto py-3">
        {repos.map((row) => {
          const label = row.rootDirectory ? appLeafName(row) : row.name;
          const active = isRowActive(
            row,
            currentOwner,
            currentName,
            currentAppName,
          );
          const tooltip = row.rootDirectory
            ? `${row.owner}/${row.name} · ${label}`
            : `${row.owner}/${row.name}`;

          return (
            <Tooltip key={row._id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    onSelect(row.owner, row.name, row.rootDirectory)
                  }
                  aria-label={tooltip}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
                    active
                      ? "border-border bg-sidebar-accent"
                      : "border-transparent opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100",
                  )}
                >
                  <RepoLogo
                    logoUrl={row.logoUrl}
                    size={30}
                    fallback={
                      <span
                        className={cn(
                          "flex size-[30px] items-center justify-center rounded-md text-sm font-semibold text-white",
                          tileColor(`${row.owner}/${row.name}/${label}`),
                        )}
                      >
                        {label.charAt(0).toUpperCase()}
                      </span>
                    }
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tooltip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
