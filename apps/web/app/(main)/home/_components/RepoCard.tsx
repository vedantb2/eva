"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { repoHref } from "@/lib/utils/repoUrl";
import {
  Card,
  CardContent,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import {
  IconBrandGithub,
  IconPlugConnectedX,
  IconDots,
  IconFolders,
} from "@tabler/icons-react";

export type Repo = FunctionReturnType<typeof api.githubRepos.list>[number];

export function RepoCard({
  repo,
  index,
  onManageApps,
}: {
  repo: Repo;
  index: number;
  onManageApps: () => void;
}) {
  return (
    <motion.div
      key={repo._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.2,
        delay: Math.min(index * 0.03, 0.2),
      }}
    >
      <div className="group/card relative">
        <Link
          href={repoHref(repo.owner, repo.name, repo.rootDirectory)}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        >
          <Card className="motion-emphasized ui-surface-interactive cursor-pointer">
            <CardContent className="flex items-center gap-3 p-3 pr-10">
              <IconBrandGithub
                size={20}
                className={
                  repo.connected === false
                    ? "text-destructive/60"
                    : "text-muted-foreground"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {repo.rootDirectory
                    ? repo.rootDirectory.split("/").pop()
                    : repo.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {repo.owner}/{repo.name}
                </p>
              </div>
              {repo.connected === false && (
                <div className="flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive">
                  <IconPlugConnectedX size={11} />
                  <span className="text-[11px] font-medium">Disconnected</span>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
        <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="motion-press rounded-full border border-transparent bg-background/45 text-muted-foreground opacity-0 transition-opacity hover:border-border/65 hover:bg-background/80 hover:text-foreground group-hover/card:opacity-100 data-[state=open]:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <IconDots size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onManageApps}>
                <IconFolders size={16} />
                Manage apps
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
