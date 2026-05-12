"use client";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Badge,
} from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { IconFolder, IconLoader2 } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { DynamicLink } from "@/lib/components/DynamicLink";

interface BuildingProjectsBadgeProps {
  repoId: Id<"githubRepos">;
  basePath: string;
}

export function BuildingProjectsBadge({
  repoId,
  basePath,
}: BuildingProjectsBadgeProps) {
  const projects = useQuery(api.projects.getActive, { repoId });
  const runningProjects = projects?.filter((p) => p.runningTaskCount > 0) ?? [];
  const buildingProjects =
    projects?.filter((p) => p.activeBuildWorkflowId !== undefined) ?? [];
  const sandboxProjects =
    projects?.filter(
      (p) =>
        p.reviewProjectSandboxStatus === "active" ||
        p.reviewProjectSandboxStatus === "starting",
    ) ?? [];

  if (
    runningProjects.length === 0 &&
    buildingProjects.length === 0 &&
    sandboxProjects.length === 0
  ) {
    return null;
  }

  const summaryParts: string[] = [];
  if (runningProjects.length > 0)
    summaryParts.push(`${runningProjects.length} running`);
  if (buildingProjects.length > 0)
    summaryParts.push(`${buildingProjects.length} building`);
  if (sandboxProjects.length > 0)
    summaryParts.push(`${sandboxProjects.length} active`);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Badge
          variant="secondary"
          className="ml-auto cursor-default items-center gap-2 border-none bg-sidebar-accent/50 px-1.5 py-0.5"
        >
          {runningProjects.length > 0 && (
            <span className="flex items-center gap-1.5">
              <IconLoader2
                size={11}
                className="animate-spin text-muted-foreground"
              />
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {runningProjects.length}
              </span>
            </span>
          )}
          {buildingProjects.length > 0 && (
            <span className="flex items-center gap-1.5">
              <IconLoader2
                size={11}
                className="animate-spin text-muted-foreground"
              />
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {buildingProjects.length}
              </span>
            </span>
          )}
          {sandboxProjects.length > 0 && (
            <span className="flex items-center gap-1.5">
              <PulseDot />
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {sandboxProjects.length}
              </span>
            </span>
          )}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-3"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <IconFolder size={15} className="text-primary" />
            <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
              Active projects
            </h3>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
              {summaryParts.map((part, i) => (
                <span key={part} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span aria-hidden className="text-muted-foreground/40">
                      ·
                    </span>
                  )}
                  <span>{part}</span>
                </span>
              ))}
            </span>
          </div>

          <div className="space-y-3">
            {runningProjects.length > 0 && (
              <Section
                label="Running"
                count={runningProjects.length}
                glyph={
                  <IconLoader2
                    size={11}
                    className="animate-spin text-muted-foreground"
                  />
                }
              >
                {runningProjects.map((project) => (
                  <ProjectRow
                    key={project._id}
                    title={project.title}
                    to={`${basePath}/projects/${project._id}`}
                  />
                ))}
              </Section>
            )}

            {buildingProjects.length > 0 && (
              <Section
                label="Building"
                count={buildingProjects.length}
                glyph={
                  <IconLoader2
                    size={11}
                    className="animate-spin text-muted-foreground"
                  />
                }
              >
                {buildingProjects.map((project) => (
                  <ProjectRow
                    key={project._id}
                    title={project.title}
                    to={`${basePath}/projects/${project._id}`}
                  />
                ))}
              </Section>
            )}

            {sandboxProjects.length > 0 && (
              <Section
                label="Sandbox"
                count={sandboxProjects.length}
                glyph={<PulseDot />}
              >
                {sandboxProjects.map((project) => (
                  <ProjectRow
                    key={project._id}
                    title={project.title}
                    to={`${basePath}/projects/${project._id}`}
                  />
                ))}
              </Section>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

interface SectionProps {
  label: string;
  count: number;
  glyph: React.ReactNode;
  children: React.ReactNode;
}

function Section({ label, count, glyph, children }: SectionProps) {
  return (
    <div className="rounded-lg bg-muted/40 p-1">
      <div className="flex items-center gap-2 px-2 pb-1 pt-1.5">
        <span className="flex h-3 w-3 items-center justify-center">
          {glyph}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/70 tabular-nums">
          {count}
        </span>
      </div>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

interface ProjectRowProps {
  title: string;
  to: string;
}

function ProjectRow({ title, to }: ProjectRowProps) {
  return (
    <DynamicLink
      to={to}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-[background-color,transform] hover:bg-background hover:translate-x-0.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight text-foreground">
            {title}
          </p>
        </div>
      </div>
    </DynamicLink>
  );
}

function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}
