"use client";

import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import {
  DraftsIcon,
  InboxIcon,
} from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { api } from "@conductor/backend";
import { UnreadInboxBadge } from "@/lib/components/sidebar/UnreadInboxBadge";
import { DraftsCountBadge } from "@/lib/components/sidebar/DraftsCountBadge";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
} from "@/lib/components/sidebar/SharedLayoutNav";

type RepoDoc = FunctionReturnType<typeof api.githubRepos.getByOwnerAndName>;

interface RepoTopNavProps {
  repoBasePath: string;
  pathname: string;
  collapsed: boolean;
  repo: RepoDoc | null | undefined;
  onNavigate: () => void;
}

/**
 * Workspace-level nav (Inbox, Drafts) rendered above the repo accordion rather
 * than nested inside a repo. Inbox is global; Drafts is per-repo but sits here
 * so both stay reachable regardless of which repo is expanded.
 */
export function RepoTopNav({
  repoBasePath,
  pathname,
  collapsed,
  repo,
  onNavigate,
}: RepoTopNavProps) {
  const items = [
    { name: "Inbox", href: `${repoBasePath}/inbox`, icon: InboxIcon },
    { name: "Drafts", href: `${repoBasePath}/drafts`, icon: DraftsIcon },
  ];

  return (
    <SharedLayoutNav layoutId="repo-top-nav" className="space-y-1">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const linkElement = (
          <SharedLayoutNavSurface
            key={item.name}
            itemId={item.name}
            isActive={isActive}
          >
            <Link
              to={item.href}
              onClick={onNavigate}
              className={sidebarNavLinkClass(isActive, collapsed)}
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
      })}
    </SharedLayoutNav>
  );
}
