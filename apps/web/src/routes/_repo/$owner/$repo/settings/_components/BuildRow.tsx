import {
  Badge,
  StatusDot,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import {
  IconChevronDown,
  IconChevronRight,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import type { SeededBuildApp, SnapshotBuild } from "../snapshots/_utils";

/** A per-app entry counts as seeded by explicit status, or (legacy rows) by name. */
function isSeededEntry(a: SeededBuildApp): boolean {
  return a.status ? a.status === "seeded" : a.seededSnapshotName !== null;
}

export function BuildRow({
  build,
  isExpanded,
  duration,
  onToggle,
}: {
  build: SnapshotBuild;
  isExpanded: boolean;
  duration: string;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="px-2 py-2 sm:px-4">
          {isExpanded ? (
            <IconChevronDown size={14} />
          ) : (
            <IconChevronRight size={14} />
          )}
        </TableCell>
        <TableCell className="px-2 py-2 sm:px-4">
          {new Date(build.startedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </TableCell>
        <TableCell className="px-2 py-2 sm:px-4">{duration}</TableCell>
        <TableCell className="px-2 py-2 capitalize sm:px-4">
          {build.triggeredBy}
        </TableCell>
        <TableCell className="px-2 py-2 sm:px-4">
          <ProviderBadge />
        </TableCell>
        <TableCell className="px-2 py-2 sm:px-4">
          <BuildKindBadge kind={build.kind} />
        </TableCell>
        <TableCell className="px-2 py-2 sm:px-4">
          <BuildStatusBadge status={build.status} />
        </TableCell>
        <TableCell className="px-2 py-2 sm:px-4">
          <SeededSummary seededApps={build.seededApps} />
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={8} className="px-4 py-3">
            {build.error && (
              <div className="mb-2 rounded-control bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {build.error}
              </div>
            )}
            {build.seededApps && build.seededApps.length > 0 && (
              <div className="mb-2 space-y-1 text-xs">
                {build.seededApps.map((a) => (
                  <div key={a.repoId} className="flex items-start gap-2">
                    {a.status === "running" ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <IconLoader2
                          size={12}
                          className="shrink-0 animate-spin"
                        />
                        {a.app ?? a.repoId} — seeding…
                      </span>
                    ) : a.seededSnapshotName ? (
                      <>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-foreground">
                          <StatusDot tone="done" />
                          {a.app ?? a.repoId}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono break-all text-muted-foreground">
                            {a.seededSnapshotName}
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-start gap-1 text-muted-foreground">
                        <IconX size={12} className="mt-0.5 shrink-0" />
                        <span className="break-words">
                          {a.app ?? a.repoId} — fell back to base Image
                        </span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {build.logs ? (
              <pre className="max-h-64 overflow-y-auto overflow-x-hidden scroll-fade rounded-control bg-muted/50 p-2 font-mono text-3xs leading-relaxed whitespace-pre-wrap break-all sm:p-3 sm:text-2xs">
                {build.logs}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">
                No logs available.
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function BuildStatusBadge({
  status,
}: {
  status: "running" | "success" | "error";
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <StatusDot tone="progress" />
        Running
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <StatusDot tone="done" />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-destructive">
      <IconX size={12} />
      Error
    </span>
  );
}

/** Sandbox provider badge with tooltip. */
function ProviderBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="quiet">▲ Vercel</Badge>
      </TooltipTrigger>
      <TooltipContent>Vercel sandbox provider</TooltipContent>
    </Tooltip>
  );
}

/** Build type badge: "Base image" (foundation only) vs "Seeded" (boots + seeds DB). */
function BuildKindBadge({ kind }: { kind?: "base" | "seeded" }) {
  if (!kind) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  if (kind === "seeded") {
    return <Badge variant="default">Seeded</Badge>;
  }
  return <Badge variant="secondary">Base image</Badge>;
}

/** Compact per-build seeding summary: seeded/total, coloured by completeness. */
function SeededSummary({ seededApps }: { seededApps?: SeededBuildApp[] }) {
  if (!seededApps || seededApps.length === 0) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  const total = seededApps.length;
  const seeded = seededApps.filter(isSeededEntry).length;
  // Still seeding: show a spinner with progress so far.
  if (seededApps.some((a) => a.status === "running")) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <IconLoader2 size={12} className="animate-spin" />
        {seeded}/{total}
      </span>
    );
  }
  const toneClass =
    seeded === total
      ? "text-success"
      : seeded === 0
        ? "text-destructive"
        : "text-warning";
  return (
    <span className={`inline-flex items-center gap-1 ${toneClass}`}>
      {seeded}/{total}
    </span>
  );
}
