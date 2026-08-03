import { useRef, useState } from "react";
import type { api, Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@eva/ui";
import {
  IconGitBranch,
  IconTrash,
  IconPhoto,
  IconPhotoOff,
  IconPencil,
} from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { RepoLabelDialog } from "@/lib/components/RepoLabelDialog";
import { useRepoLogoUpload } from "@/lib/hooks/useRepoLogoUpload";
import { appLeafName, repoDisplayLabel } from "@/lib/utils/repoGrouping";

type Repo = FunctionReturnType<typeof api.githubRepos.listByTeam>[number];

/** A single repo row in the team repos tab, with logo display + owner actions. */
export function TeamRepoCard({
  repo,
  teamId,
  isOwner,
  onRemove,
}: {
  repo: Repo;
  teamId: Id<"teams">;
  isOwner: boolean;
  onRemove: (repoId: Id<"githubRepos">) => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const { uploadLogo, removeLogo } = useRepoLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadLogo(repo._id, file);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted/40">
            <div className="flex min-w-0 items-center gap-2">
              <RepoLogo
                logoUrl={repo.logoUrl}
                size={28}
                fallback={
                  <IconGitBranch size={28} className="text-muted-foreground" />
                }
              />
              <div className="min-w-0">
                <p className="truncate text-2sm font-medium">
                  {repoDisplayLabel(repo)}
                </p>
                <p className="text-2xs text-muted-foreground">
                  {repo.owner}/{repo.name}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Rename"
                  onClick={() => setRenameOpen(true)}
                >
                  <IconPencil size={14} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title={repo.logoUrl ? "Change logo" : "Set logo"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconPhoto size={14} />
                </Button>
                {repo.logoUrl && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Remove logo"
                    onClick={() => removeLogo(repo._id)}
                  >
                    <IconPhotoOff size={14} />
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Remove from team"
                  onClick={() => onRemove(repo._id)}
                >
                  <IconTrash size={14} />
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoSelected}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent onClick={(e) => e.stopPropagation()}>
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            <IconPencil size={16} />
            Rename
          </ContextMenuItem>
          {isOwner ? (
            <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
              <IconPhoto size={16} />
              {repo.logoUrl ? "Change logo" : "Set logo"}
            </ContextMenuItem>
          ) : null}
          {isOwner && repo.logoUrl ? (
            <ContextMenuItem onClick={() => removeLogo(repo._id)}>
              <IconPhotoOff size={16} />
              Remove logo
            </ContextMenuItem>
          ) : null}
          {isOwner ? (
            <ContextMenuItem onClick={() => onRemove(repo._id)}>
              <IconTrash size={16} />
              Remove from team
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <RepoLabelDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        repoId={repo._id}
        label={repo.label}
        fallbackName={appLeafName(repo)}
        teamId={teamId}
      />
    </>
  );
}
