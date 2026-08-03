import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import type { api, Id } from "@eva/backend";
import {
  Badge,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ListRow,
} from "@eva/ui";
import {
  IconUsers,
  IconTrash,
  IconPhoto,
  IconPhotoOff,
} from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useTeamLogoUpload } from "@/lib/hooks/useTeamLogoUpload";

type Team = FunctionReturnType<typeof api.teams.list>[number];

/** Team list row with logo display and a right-click menu for logo and delete. */
export function TeamCard({
  team,
  onDelete,
}: {
  team: Team;
  onDelete?: (team: { id: Id<"teams">; name: string }) => void;
}) {
  const { uploadLogo, removeLogo } = useTeamLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canDelete = team.userRole === "owner" && team.isPersonal !== true;
  const displayName = team.displayName ?? team.name;

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadLogo(team._id, file);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <ListRow
            density="compact"
            link={<Link to="/teams/$teamId" params={{ teamId: team._id }} />}
            aria-label={displayName}
          >
            <div className="flex items-center gap-2.5">
              <RepoLogo
                logoUrl={team.logoUrl}
                size={20}
                fallback={
                  <div className="flex size-5 items-center justify-center rounded-control border border-border bg-muted">
                    <IconUsers size={12} className="text-muted-foreground" />
                  </div>
                }
              />
              <span className="min-w-0 flex-1 truncate text-2sm font-medium">
                {displayName}
              </span>
              <Badge variant="quiet" className="shrink-0">
                {team.userRole}
              </Badge>
            </div>
          </ListRow>
        </ContextMenuTrigger>
        <ContextMenuContent onClick={(e) => e.stopPropagation()}>
          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
            <IconPhoto size={16} />
            {team.logoUrl ? "Change logo" : "Set logo"}
          </ContextMenuItem>
          {team.logoUrl ? (
            <ContextMenuItem onClick={() => void removeLogo(team._id)}>
              <IconPhotoOff size={16} />
              Remove logo
            </ContextMenuItem>
          ) : null}
          {canDelete && onDelete ? (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive"
                onClick={() => onDelete({ id: team._id, name: displayName })}
              >
                <IconTrash size={16} />
                Delete team
              </ContextMenuItem>
            </>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoSelected}
      />
    </>
  );
}
