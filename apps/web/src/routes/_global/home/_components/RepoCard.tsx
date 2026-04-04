import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { motion } from "motion/react";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { repoHref } from "@/lib/utils/repoUrl";
import {
  Card,
  CardContent,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@conductor/ui";
import {
  IconBrandGithub,
  IconPlugConnectedX,
  IconFolders,
  IconEyeOff,
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
  const toggleHidden = useMutation(api.githubRepos.toggleHidden);
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group/card relative">
            <Link
              to={repoHref(repo.owner, repo.name, repo.rootDirectory)}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <Card className="motion-emphasized ui-surface-interactive cursor-pointer">
                <CardContent className="flex items-center gap-3 p-3">
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
                      <span className="text-[11px] font-medium">
                        Disconnected
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent onClick={(e) => e.stopPropagation()}>
          <ContextMenuItem onClick={onManageApps}>
            <IconFolders size={16} />
            Manage apps
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => toggleHidden({ repoId: repo._id, hidden: true })}
          >
            <IconEyeOff size={16} />
            Hide
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  );
}
