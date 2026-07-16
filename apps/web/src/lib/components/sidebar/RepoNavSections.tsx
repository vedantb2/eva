"use client";

import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType } from "react";
import type { FunctionReturnType } from "convex/server";
import { IconChevronRight } from "@tabler/icons-react";
import {
  AutomationsIcon,
  DesignsIcon,
  DocumentsIcon,
  DraftsIcon,
  InboxIcon,
  ProjectsIcon,
  QuickTasksIcon,
  SessionsIcon,
  SettingsIcon,
  StatsIcon,
  TestingArenaIcon,
} from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { api } from "@conductor/backend";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@conductor/ui";
import { ActiveTasksBadge } from "@/lib/components/sidebar/ActiveTasksPopover";
import { BuildingProjectsBadge } from "@/lib/components/sidebar/BuildingProjectsBadge";
import { ActiveCountBadge } from "@/lib/components/sidebar/ActiveCountBadge";
import { UnreadInboxBadge } from "@/lib/components/sidebar/UnreadInboxBadge";
import { UnreadAutomationsBadge } from "@/lib/components/sidebar/UnreadAutomationsBadge";
import { DraftsCountBadge } from "@/lib/components/sidebar/DraftsCountBadge";
import { CollapsibleSidebarSection } from "@/lib/components/sidebar/CollapsibleSidebarSection";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
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
 * Per-repo navigation (Inbox/Drafts + BUILD/SHIP/TEST/MORE groups). Rendered
 * either standalone in the collapsed icon rail or nested under the active
 * repo row inside `RepoAccordion`.
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

  const [openNavSections, setOpenNavSections] = useState<
    Record<string, boolean>
  >({
    BUILD: true,
    SHIP: true,
    TEST: true,
    MORE: true,
  });

  const toggleNavSection = (label: string) => {
    setOpenNavSections((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? true),
    }));
  };

  const repoNavigation = useMemo(() => {
    const allGroups: RepoMainNavGroup[] = [
      {
        label: "BUILD",
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
        label: "SHIP",
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
          {
            name: "Sessions",
            href: `${repoBasePath}/sessions`,
            icon: SessionsIcon,
          },
        ],
      },
      {
        label: "TEST",
        items: [
          {
            name: "Documents",
            href: `${repoBasePath}/docs`,
            icon: DocumentsIcon,
          },
          {
            name: "Testing Arena",
            href: `${repoBasePath}/testing-arena`,
            icon: TestingArenaIcon,
          },
        ],
      },
      {
        label: "MORE",
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
    return allGroups
      .filter((g) => !g.devOnly)
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.devOnly),
      }))
      .filter((g) => g.items.length > 0);
  }, [repoBasePath, isDev]);

  const repoTopNavItems = useMemo(
    (): RepoMainNavItem[] => [
      {
        name: "Inbox",
        href: `${repoBasePath}/inbox`,
        icon: InboxIcon,
      },
      {
        name: "Drafts",
        href: `${repoBasePath}/drafts`,
        icon: DraftsIcon,
      },
    ],
    [repoBasePath],
  );

  const navItemClass = (isActive: boolean) =>
    sidebarNavLinkClass(isActive, collapsed);

  const renderRepoNavItem = (item: RepoMainNavItem) => {
    const isActive = pathname.startsWith(item.href);
    const contextMode = contextSidebarModeForNav(item.name);

    if (contextMode && !collapsed) {
      const showActiveCount =
        (item.name === "Sessions" || item.name === "Designs") && repo;
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
            {showActiveCount && repo && (
              <ActiveCountBadge
                repoId={repo._id}
                type={item.name === "Sessions" ? "sessions" : "designs"}
              />
            )}
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
          {item.name === "Inbox" && !collapsed && <UnreadInboxBadge />}
          {item.name === "Drafts" && !collapsed && repo && (
            <DraftsCountBadge repoId={repo._id} />
          )}
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
      <div className="space-y-1">{repoTopNavItems.map(renderRepoNavItem)}</div>
      {repoNavigation.map((group) => (
        <div key={group.label}>
          <CollapsibleSidebarSection
            label={group.label}
            open={openNavSections[group.label] ?? true}
            onToggle={() => toggleNavSection(group.label)}
            showHeader={!collapsed}
          >
            {group.items.map(renderRepoNavItem)}
          </CollapsibleSidebarSection>
        </div>
      ))}
    </SharedLayoutNav>
  );
}
