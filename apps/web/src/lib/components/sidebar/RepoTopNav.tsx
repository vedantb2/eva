import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { DraftsIcon } from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { type api } from "@eva/backend";
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
 * Per-repo workspace shortcuts above the build-pipeline nav. Drafts stay here
 * because they are repo/app-specific; Inbox lives on the left icon rail as a
 * global destination.
 */
export function RepoTopNav({
  repoBasePath,
  pathname,
  collapsed,
  repo,
  onNavigate,
}: RepoTopNavProps) {
  const href = `${repoBasePath}/drafts`;
  const isActive = pathname.startsWith(href);

  const linkElement = (
    <SharedLayoutNavSurface itemId="Drafts" isActive={isActive}>
      <Link
        to={href}
        onClick={onNavigate}
        className={sidebarNavLinkClass(isActive, collapsed)}
      >
        <DraftsIcon
          size={19}
          className={cn(
            "shrink-0",
            isActive ? "text-sidebar-primary" : "text-muted-foreground",
          )}
        />
        {!collapsed && <span className="truncate">Drafts</span>}
        {!collapsed && repo ? <DraftsCountBadge repoId={repo._id} /> : null}
      </Link>
    </SharedLayoutNavSurface>
  );

  return (
    <SharedLayoutNav layoutId="repo-top-nav" className="space-y-1">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
          <TooltipContent side="right">Drafts</TooltipContent>
        </Tooltip>
      ) : (
        linkElement
      )}
    </SharedLayoutNav>
  );
}
