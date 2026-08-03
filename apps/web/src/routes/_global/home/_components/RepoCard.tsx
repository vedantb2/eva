import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { m } from "motion/react";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { repoHref } from "@/lib/utils/repoUrl";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { RepoLabelDialog } from "@/lib/components/RepoLabelDialog";
import { useRepoLogoUpload } from "@/lib/hooks/useRepoLogoUpload";
import { appLeafName, repoDisplayLabel } from "@/lib/utils/repoGrouping";
import {
  Badge,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ListRow,
} from "@eva/ui";
import {
  IconBrandGithub,
  IconPlugConnectedX,
  IconFolders,
  IconEyeOff,
  IconPhoto,
  IconPhotoOff,
  IconPencil,
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
  const [renameOpen, setRenameOpen] = useState(false);
  const toggleHidden = useMutation(
    api.githubRepos.toggleHidden,
  ).withOptimisticUpdate((localStore, args) => {
    const visible = localStore.getQuery(api.githubRepos.list, {});
    if (visible !== undefined && args.hidden) {
      localStore.setQuery(
        api.githubRepos.list,
        {},
        visible.filter((r) => r._id !== args.repoId),
      );
    }
  });
  const { uploadLogo, removeLogo } = useRepoLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadLogo(repo._id, file);
  };
  return (
    <m.div
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
        {/* The tile is a list row rather than a Card wrapped in a Link: the row
            owns the hairline, hover tone, focus ring and the stretched link, so
            the codebase grid and every other list in the app share one shell. */}
        <ContextMenuTrigger asChild>
          <ListRow
            density="compact"
            aria-label={repoDisplayLabel(repo)}
            link={
              <Link to={repoHref(repo.owner, repo.name, repo.rootDirectory)} />
            }
            contentClassName="flex items-center gap-2.5 p-2.5"
          >
            <RepoLogo
              logoUrl={repo.logoUrl}
              size={24}
              fallback={
                <IconBrandGithub
                  size={24}
                  className={
                    repo.connected === false
                      ? "text-destructive/60"
                      : "text-muted-foreground"
                  }
                />
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-2sm font-medium text-foreground">
                {repoDisplayLabel(repo)}
              </p>
              <p className="truncate text-2xs text-muted-foreground">
                {repo.owner}/{repo.name}
              </p>
            </div>
            {repo.connected === false && (
              <Badge variant="quiet" className="shrink-0 gap-1 text-3xs">
                <IconPlugConnectedX size={11} className="text-destructive" />
                Disconnected
              </Badge>
            )}
          </ListRow>
        </ContextMenuTrigger>
        <ContextMenuContent onClick={(e) => e.stopPropagation()}>
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            <IconPencil size={16} />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={onManageApps}>
            <IconFolders size={16} />
            Manage apps
          </ContextMenuItem>
          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
            <IconPhoto size={16} />
            {repo.logoUrl ? "Change logo" : "Set logo"}
          </ContextMenuItem>
          {repo.logoUrl && (
            <ContextMenuItem onClick={() => removeLogo(repo._id)}>
              <IconPhotoOff size={16} />
              Remove logo
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={() => toggleHidden({ repoId: repo._id, hidden: true })}
          >
            <IconEyeOff size={16} />
            Hide
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoSelected}
      />
      <RepoLabelDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        repoId={repo._id}
        label={repo.label}
        fallbackName={appLeafName(repo)}
      />
    </m.div>
  );
}
