import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import type { api, Id } from "@conductor/backend";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@conductor/ui";
import {
  IconUsers,
  IconTrash,
  IconPhoto,
  IconPhotoOff,
} from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useTeamLogoUpload } from "@/lib/hooks/useTeamLogoUpload";

type Team = FunctionReturnType<typeof api.teams.list>[number];

/** Team list card with logo display and context-menu set/change/remove. */
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
          <div>
            <Link
              to="/teams/$teamId"
              params={{ teamId: team._id }}
              className="block rounded-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <RepoLogo
                        logoUrl={team.logoUrl}
                        size={32}
                        fallback={
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <IconUsers size={16} className="text-primary" />
                          </div>
                        }
                      />
                      <CardTitle className="text-base">{displayName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canDelete && onDelete ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete({ id: team._id, name: displayName });
                          }}
                        >
                          <IconTrash size={14} />
                        </Button>
                      ) : null}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {team.userRole}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
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
