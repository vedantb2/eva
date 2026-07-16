"use client";

import { Fragment, type ReactNode } from "react";
import { IconBrandGithub, IconFolder } from "@tabler/icons-react";
import {
  appLeafName,
  appMatchesLabel,
  groupReposByCodebase,
  type RepoWithLogo,
} from "@/lib/utils/repoGrouping";
import { RepoAccordionRow } from "@/lib/components/sidebar/RepoAccordionRow";

interface RepoAccordionProps {
  repos: RepoWithLogo[];
  currentOwner: string | null;
  currentName: string | null;
  currentAppName: string | undefined;
  onSelect: (owner: string, name: string, rootDirectory?: string) => void;
  /** Per-repo nav rendered nested under the active (expanded) codebase. */
  children: ReactNode;
}

const githubFallback = (
  <IconBrandGithub size={16} className="shrink-0 text-muted-foreground" />
);
const folderFallback = (
  <IconFolder size={14} className="shrink-0 text-muted-foreground" />
);

/**
 * Inline single-expand repo accordion. Every visible codebase is listed; the
 * active codebase (derived from the URL) is the only one expanded, revealing
 * its monorepo apps and per-repo nav (`children`). Clicking any other row
 * switches to that repo — expansion always follows the URL, never local state.
 */
export function RepoAccordion({
  repos,
  currentOwner,
  currentName,
  currentAppName,
  onSelect,
  children,
}: RepoAccordionProps) {
  const groups = groupReposByCodebase(repos);
  const showOwnerHeaders = new Set(groups.map((g) => g.owner)).size > 1;

  const hasActiveGroup =
    currentOwner !== null &&
    currentName !== null &&
    groups.some((g) => g.owner === currentOwner && g.name === currentName);

  const nestedNav = (
    <div className="ml-3 mt-1 border-l border-sidebar-border pl-2">
      {children}
    </div>
  );

  let lastOwner: string | null = null;

  return (
    <div className="space-y-1">
      {/* Active repo not in the list (hidden repo opened by URL, or list still
          loading): show a synthetic anchor row so the nav keeps its context. */}
      {currentOwner && currentName && !hasActiveGroup && (
        <div>
          <RepoAccordionRow
            label={
              currentAppName ? `${currentName}/${currentAppName}` : currentName
            }
            fallbackIcon={githubFallback}
            active
            onClick={() => onSelect(currentOwner, currentName)}
          />
          {nestedNav}
        </div>
      )}

      {groups.map((group) => {
        const isActiveCodebase =
          group.owner === currentOwner && group.name === currentName;
        const parentActive = isActiveCodebase && currentAppName === undefined;
        const showHeader = showOwnerHeaders && group.owner !== lastOwner;
        lastOwner = group.owner;

        return (
          <Fragment key={`${group.owner}/${group.name}`}>
            {showHeader && (
              <p className="px-1 pb-0.5 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/55">
                {group.owner}
              </p>
            )}
            <RepoAccordionRow
              label={group.name}
              logoUrl={group.root?.logoUrl}
              fallbackIcon={githubFallback}
              active={parentActive}
              expandable
              expanded={isActiveCodebase}
              onClick={() => {
                if (group.root) {
                  onSelect(group.owner, group.name);
                } else if (group.apps.length > 0) {
                  onSelect(
                    group.owner,
                    group.name,
                    group.apps[0].rootDirectory,
                  );
                }
              }}
            />

            {isActiveCodebase && (
              <>
                {group.apps.length > 0 && (
                  <div className="ml-3 space-y-0.5 border-l border-sidebar-border pl-2">
                    {group.apps.map((app) => (
                      <RepoAccordionRow
                        key={app._id}
                        label={appLeafName(app)}
                        logoUrl={app.logoUrl}
                        fallbackIcon={folderFallback}
                        active={
                          currentAppName !== undefined &&
                          appMatchesLabel(app, currentAppName)
                        }
                        indent
                        onClick={() =>
                          onSelect(app.owner, app.name, app.rootDirectory)
                        }
                      />
                    ))}
                  </div>
                )}
                {nestedNav}
              </>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
