"use client";

import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import type { FunctionReturnType } from "convex/server";
import { IconChevronRight } from "@tabler/icons-react";
import {
  AutomationsIcon,
  DesignsIcon,
  DocumentsIcon,
  ReviewsIcon,
  ProjectsIcon,
  QuickTasksIcon,
  SettingsIcon,
  StatsIcon,
  TestingArenaIcon,
} from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { type api } from "@eva/backend";
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { ActiveTasksBadge } from "@/lib/components/sidebar/ActiveTasksPopover";
import { BuildingProjectsBadge } from "@/lib/components/sidebar/BuildingProjectsBadge";
import { ActiveCountBadge } from "@/lib/components/sidebar/ActiveCountBadge";
import { UnreadAutomationsBadge } from "@/lib/components/sidebar/UnreadAutomationsBadge";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
  sidebarSectionLabelClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import {
  contextSidebarModeForNav,
  type ContextSidebarMode,
} from "@/lib/components/sidebar/contextSidebarModes";

type RepoDoc = FunctionReturnType<typeof api.githubRepos.getByOwnerAndName>;

type RepoMainNavIcon = ComponentType<{
  size?: number;
  className?: string;
}>;

type RepoMainNavItem = {
  name: string;
  href: string;
  icon: RepoMainNavIcon;
  devOnly?: boolean;
};

type RepoMainNavGroup = {
  label: string;
  items: RepoMainNavItem[];
  devOnly?: boolean;
};

interface RepoNavSectionsProps {
  repoBasePath: string;
  pathname: string;
  collapsed: boolean;
  repo: RepoDoc | null | undefined;
  onOpenContextSidebar: (mode: ContextSidebarMode) => void;
  onNavigate: () => void;
}

/**
 * Per-repo build-pipeline navigation (Build/Ship/Test/More groups) for the
 * active repo. The far-left `RepoRail` handles switching between repos;
 * Inbox/Drafts: Inbox is on the left icon rail (global); Drafts stay above
 * these groups in `RepoTopNav` because they are per-repo.
 */
export function RepoNavSections({
  repoBasePath,
  pathname,
  collapsed,
  repo,
  onOpenContextSidebar,
  onNavigate,
}: RepoNavSectionsProps) {
  const isDev = import.meta.env.DEV;

  const repoNavigation = (() => {
    const allGroups: RepoMainNavGroup[] = [
      {
        label: "Build",
        items: [
          {
            name: "Designs",
            href: `${repoBasePath}/designs`,
            icon: DesignsIcon,
            devOnly: true,
          },
        ],
      },
      {
        label: "Ship",
        items: [
          {
            name: "Projects",
            href: `${repoBasePath}/projects`,
            icon: ProjectsIcon,
          },
          {
            name: "Quick Tasks",
            href: `${repoBasePath}/quick-tasks`,
            icon: QuickTasksIcon,
          },
        ],
      },
      {
        label: "Test",
        items: [
          {
            name: "Documents",
            href: `${repoBasePath}/docs`,
            icon: DocumentsIcon,
          },
          {
            name: "Reviews",
            href: `${repoBasePath}/reviews`,
            icon: ReviewsIcon,
          },
          {
            name: "Testing Arena",
            href: `${repoBasePath}/testing-arena`,
            icon: TestingArenaIcon,
          },
        ],
      },
      {
        label: "More",
        items: [
          {
            name: "Automations",
            href: `${repoBasePath}/automations`,
            icon: AutomationsIcon,
          },
          {
            name: "Stats",
            href: `${repoBasePath}/stats`,
            icon: StatsIcon,
          },
          {
            name: "Settings",
            href: `${repoBasePath}/settings/config`,
            icon: SettingsIcon,
          },
        ],
      },
    ];
    if (isDev) return allGroups;
    return allGroups.flatMap((g) => {
      if (g.devOnly) return [];
      const items = g.items.filter((i) => !i.devOnly);
      if (items.length === 0) return [];
      return [{ ...g, items }];
    });
  })();

  const navItemClass = (isActive: boolean) =>
    sidebarNavLinkClass(isActive, collapsed);

  const renderRepoNavItem = (item: RepoMainNavItem) => {
    const isActive = pathname.startsWith(item.href);
    const contextMode = contextSidebarModeForNav(item.name);

    if (contextMode && !collapsed) {
      const showActiveCount = item.name === "Designs" && repo;
      return (
        <SharedLayoutNavSurface
          key={item.name}
          itemId={item.name}
          isActive={isActive}
          className="group relative"
        >
          <button
            type="button"
            onClick={() => {
              onOpenContextSidebar(contextMode);
            }}
            className={cn(navItemClass(isActive), "w-full pr-9")}
          >
            <item.icon
              size={19}
              className={cn(
                "shrink-0",
                isActive ? "text-sidebar-primary" : "text-muted-foreground",
              )}
            />
            <span className="truncate">{item.name}</span>
            {showActiveCount && repo && <ActiveCountBadge repoId={repo._id} />}
            {item.name === "Automations" && repo && (
              <UnreadAutomationsBadge repoId={repo._id} />
            )}
          </button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="absolute right-2 top-1/2 z-20 h-6 w-6 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-sidebar-foreground after:absolute after:inset-[-8px]"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenContextSidebar(contextMode);
            }}
            title={`Open ${item.name.toLowerCase()} sidebar`}
          >
            <IconChevronRight size={14} className="text-muted-foreground" />
          </Button>
        </SharedLayoutNavSurface>
      );
    }

    const linkElement = (
      <SharedLayoutNavSurface
        key={item.name}
        itemId={item.name}
        isActive={isActive}
      >
        <Link
          to={item.href}
          onClick={() => {
            if (contextMode) {
              onOpenContextSidebar(contextMode);
            }
            if (!contextMode) {
              onNavigate();
            }
          }}
          className={navItemClass(isActive)}
        >
          <item.icon
            size={19}
            className={cn(
              "shrink-0",
              isActive ? "text-sidebar-primary" : "text-muted-foreground",
            )}
          />
          {!collapsed && <span className="truncate">{item.name}</span>}
          {item.name === "Quick Tasks" && !collapsed && repo && (
            <ActiveTasksBadge repoId={repo._id} basePath={repoBasePath} />
          )}
          {item.name === "Projects" && !collapsed && repo && (
            <BuildingProjectsBadge repoId={repo._id} basePath={repoBasePath} />
          )}
        </Link>
      </SharedLayoutNavSurface>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }

    return linkElement;
  };

  return (
    <SharedLayoutNav layoutId="repo-main-nav" className="space-y-4">
      {repoNavigation.map((group) => (
        <div key={group.label}>
          {!collapsed ? (
            <p className={sidebarSectionLabelClass}>{group.label}</p>
          ) : null}
          <div className="space-y-1">{group.items.map(renderRepoNavItem)}</div>
        </div>
      ))}
    </SharedLayoutNav>
  );
}
