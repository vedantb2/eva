"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@eva/ui";
import {
  IconBrandGithub,
  IconCheck,
  IconChevronDown,
} from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useRepo } from "@/lib/contexts/RepoContext";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
import { repoTileColor } from "@/lib/utils/repoTileColor";
import { repoHref } from "@/lib/utils/repoUrl";

/**
 * The app name inside the landing composer headline, as an app switcher.
 * Lists the same rows as the vertical rail (`githubRepos.list`, deduped by the
 * Convex query cache) and links to the same destination a rail tile does, so
 * both entry points stay in sync.
 */
export function ComposerAppSwitcher() {
  const { repo } = useRepo();
  const logoUrl = useQuery(api.githubRepos.getLogoUrl, { repoId: repo._id });
  const repos = useQuery(api.githubRepos.list, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto min-w-0 max-w-full gap-1.5 p-0 text-xl font-semibold tracking-tight underline decoration-primary/30 decoration-1 underline-offset-4 hover:text-primary/60 hover:decoration-primary/60 sm:text-2xl"
        >
          <RepoLogo
            logoUrl={logoUrl}
            size={28}
            fallback={
              <IconBrandGithub
                size={28}
                className="shrink-0 text-muted-foreground"
              />
            }
          />
          <span className="truncate">{repoDisplayLabel(repo)}</span>
          <IconChevronDown size={16} className="shrink-0 no-underline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="max-h-80 w-64 overflow-y-auto"
      >
        {(repos ?? []).map((row) => {
          const displayName = repoDisplayLabel(row);
          const active = row._id === repo._id;
          const tileColor = repoTileColor(
            `${row.owner}/${row.name}/${displayName}`,
          );

          return (
            <DropdownMenuItem key={row._id} asChild>
              <Link
                to={repoHref(row.owner, row.name, row.rootDirectory)}
                className="flex items-center gap-2"
              >
                <RepoLogo
                  logoUrl={row.logoUrl}
                  size={20}
                  fallback={
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-control text-3xs font-semibold",
                        tileColor.bg,
                        tileColor.text,
                      )}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  }
                />
                <span className="truncate">{displayName}</span>
                {active ? (
                  <IconCheck
                    size={14}
                    className="ml-auto shrink-0 text-primary"
                  />
                ) : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
