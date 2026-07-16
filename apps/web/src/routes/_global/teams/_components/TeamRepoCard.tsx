import { useRef } from "react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { Card, CardContent, Button } from "@conductor/ui";
import {
  IconGitBranch,
  IconTrash,
  IconPhoto,
  IconPhotoOff,
} from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useRepoLogoUpload } from "@/lib/hooks/useRepoLogoUpload";

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
  const { uploadLogo, removeLogo } = useRepoLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadLogo(repo._id, file);
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <RepoLogo
            logoUrl={repo.logoUrl}
            fallback={
              <IconGitBranch size={20} className="text-muted-foreground" />
            }
          />
          <div>
            <p className="text-sm font-medium">
              {repo.rootDirectory
                ? repo.rootDirectory.split("/").pop()
                : repo.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {repo.owner}/{repo.name}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              title={repo.logoUrl ? "Change logo" : "Set logo"}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconPhoto size={14} />
            </Button>
            {repo.logoUrl && (
              <Button
                size="icon"
                variant="ghost"
                title="Remove logo"
                onClick={() => removeLogo(repo._id)}
              >
                <IconPhotoOff size={14} />
              </Button>
            )}
            <Button
              size="icon"
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
      </CardContent>
    </Card>
  );
}
