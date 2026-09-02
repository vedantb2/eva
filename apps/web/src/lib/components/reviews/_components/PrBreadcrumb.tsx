"use client";

import { Link } from "@tanstack/react-router";
import { IconLayoutSidebar } from "@tabler/icons-react";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

/**
 * Where this pull request sits: repository, then the section it belongs to. The
 * standalone Reviews page is reachable straight from a link in a task or a chat
 * message, so it cannot assume the reader arrived through the sidebar and knows
 * which repository they are looking at.
 *
 * Quiet by design — small, muted, and above the title rather than beside it. It is
 * orientation, not navigation the reader came for.
 */
export function PrBreadcrumb({
  basePath,
  owner,
  name,
}: {
  /** The router's internal repo href, e.g. `/owner--repo/app`. */
  basePath: string;
  owner: string;
  name: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
    >
      <IconLayoutSidebar size={13} className="shrink-0 opacity-70" aria-hidden />
      <Crumb to={toInternalRepoHref(basePath)}>{owner}</Crumb>
      <Separator />
      <Crumb to={toInternalRepoHref(basePath)}>{name}</Crumb>
      <Separator />
      <Crumb to={toInternalRepoHref(`${basePath}/reviews`)}>reviews</Crumb>
    </nav>
  );
}

function Crumb({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="min-w-0 truncate transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function Separator() {
  return (
    <span aria-hidden className="shrink-0 text-muted-foreground/50">
      /
    </span>
  );
}
