"use client";

import { HoverCard, HoverCardTrigger, HoverCardContent } from "@eva/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { IconFolder } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { entityPathSegment } from "@/lib/numId";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";
import {
  SidebarActivityBadge,
  SidebarActivityBusyGlyph,
  SidebarActivityHeader,
  SidebarActivityRow,
  SidebarActivitySandboxGlyph,
  SidebarActivitySection,
} from "@/lib/components/sidebar/_components/SidebarActivityHoverCard";

interface BuildingProjectsBadgeProps {
  repoId: Id<"githubRepos">;
  basePath: string;
}

export function BuildingProjectsBadge({
  repoId,
  basePath,
}: BuildingProjectsBadgeProps) {
  const projects = useQuery(api.projects.getActive, { repoId });
  const buildingProjects =
    projects?.filter((p) => p.activeBuildWorkflowId !== undefined) ?? [];
  const sandboxProjects =
    projects?.filter(
      (p) =>
        p.reviewProjectSandboxStatus === "active" ||
        p.reviewProjectSandboxStatus === "starting",
    ) ?? [];

  if (buildingProjects.length === 0 && sandboxProjects.length === 0) {
    return null;
  }

  const summaryParts: string[] = [];
  if (buildingProjects.length > 0)
    summaryParts.push(`${buildingProjects.length} building`);
  if (sandboxProjects.length > 0)
    summaryParts.push(`${sandboxProjects.length} active`);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <SidebarActivityBadge
          busyCount={buildingProjects.length}
          sandboxCount={sandboxProjects.length}
        />
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-3"
      >
        <div className="space-y-4">
          <SidebarActivityHeader
            icon={<IconFolder size={15} className="text-primary" />}
            title="Active projects"
            summaryParts={summaryParts}
          />

          <div className="space-y-3">
            {buildingProjects.length > 0 && (
              <SidebarActivitySection
                label="Building"
                count={buildingProjects.length}
                glyph={<SidebarActivityBusyGlyph />}
              >
                {buildingProjects.map((project) => (
                  <SidebarActivityRow
                    key={project._id}
                    title={project.title}
                    to={toInternalRepoHref(
                      `${basePath}/projects/${entityPathSegment(project) ?? ""}`,
                    )}
                  />
                ))}
              </SidebarActivitySection>
            )}

            {sandboxProjects.length > 0 && (
              <SidebarActivitySection
                label="Sandbox"
                count={sandboxProjects.length}
                glyph={<SidebarActivitySandboxGlyph />}
              >
                {sandboxProjects.map((project) => (
                  <SidebarActivityRow
                    key={project._id}
                    title={project.title}
                    to={toInternalRepoHref(
                      `${basePath}/projects/${entityPathSegment(project) ?? ""}`,
                    )}
                  />
                ))}
              </SidebarActivitySection>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
