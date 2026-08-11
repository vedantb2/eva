"use client";

import { useNavigate } from "@tanstack/react-router";
import { Tabs, TabsBar, TabsList, TabsTrigger } from "@eva/ui";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

/** Primary project tabs. `work` is the index route, so it owns every deep link. */
export type ProjectMainTab = "overview" | "work";

export function ProjectMainTabs({
  projectHref,
  activeTab,
  workTabLabel,
}: {
  /** Project base path, e.g. `/owner/repo/projects/3` (pre-internal form). */
  projectHref: string;
  activeTab: ProjectMainTab;
  /** "Tasks" for active projects, "Plan" while drafting. */
  workTabLabel: string;
}) {
  const navigate = useNavigate();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        navigate({
          to: toInternalRepoHref(
            value === "overview" ? `${projectHref}/overview` : projectHref,
          ),
        })
      }
    >
      {/* Lives in the page header, so no hairline and no padding of its own. */}
      <TabsBar className="border-b-0 p-0">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="work">{workTabLabel}</TabsTrigger>
        </TabsList>
      </TabsBar>
    </Tabs>
  );
}
