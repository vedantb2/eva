import { useRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { TeamDetailTab } from "@/lib/search-params";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useTeamLogoUpload } from "@/lib/hooks/useTeamLogoUpload";
import { useTeamBackgroundUpload } from "@/lib/hooks/useTeamBackgroundUpload";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@eva/ui";
import { IconUsers, IconPhoto, IconPhotoOff } from "@tabler/icons-react";
import { TeamMembersTab } from "./_components/TeamMembersTab";
import { TeamReposTab } from "./_components/TeamReposTab";
import { TeamEnvVarsTab } from "./_components/TeamEnvVarsTab";
import { TeamArtifactsTab } from "./_components/TeamArtifactsTab";
import { useNavigate } from "@tanstack/react-router";

export function TeamDetailClient({
  teamId,
  tab,
}: {
  teamId: string;
  tab: TeamDetailTab;
}) {
  const navigate = useNavigate();
  const team = useQuery(api.teams.get, { id: teamId });
  const members =
    useQuery(api.teamMembers.list, team ? { teamId: team._id } : "skip") ?? [];
  const repos =
    useQuery(
      api.githubRepos.listByTeam,
      team ? { teamId: team._id } : "skip",
    ) ?? [];
  const allRepos =
    useQuery(api.githubRepos.list, { includeHidden: true }) ?? [];
  const teamEnvVars = useQuery(
    api.teamEnvVars.list,
    team ? { teamId: team._id } : "skip",
  );
  const {
    uploadLogo,
    removeLogo,
    uploading: logoUploading,
  } = useTeamLogoUpload();
  const {
    uploadBackground,
    removeBackground,
    uploading: backgroundUploading,
  } = useTeamBackgroundUpload();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  if (!team) {
    return (
      <PageWrapper title="Team">
        <EntityNotFound entityLabel="team" backTo="/teams" />
      </PageWrapper>
    );
  }

  const isOwner = team.userRole === "owner";
  const displayName = team.displayName ?? team.name;

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadLogo(team._id, file);
  };

  const handleBackgroundSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadBackground(team._id, file);
  };

  return (
    <PageWrapper
      title={
        <span className="flex min-w-0 items-center gap-2.5">
          <RepoLogo
            logoUrl={team.logoUrl}
            size={28}
            fallback={
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                <IconUsers size={14} className="text-primary" />
              </div>
            }
          />
          <span className="truncate">{displayName}</span>
        </span>
      }
      headerRight={
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={logoUploading}
            onClick={() => logoInputRef.current?.click()}
          >
            <IconPhoto size={14} className="mr-1.5" />
            {team.logoUrl ? "Change logo" : "Set logo"}
          </Button>
          {team.logoUrl ? (
            <Button
              size="icon-sm"
              variant="ghost"
              title="Remove logo"
              disabled={logoUploading}
              onClick={() => void removeLogo(team._id)}
            >
              <IconPhotoOff size={14} />
            </Button>
          ) : null}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelected}
          />
        </div>
      }
    >
      <div className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="relative h-28 w-full bg-muted">
          {team.backgroundUrl ? (
            <img
              src={team.backgroundUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <IconPhoto size={16} />
              No sidebar background
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Sidebar background
              </p>
              <p className="text-xs text-muted-foreground">
                Shown behind the app name at the top of this team&apos;s
                sidebars.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="bg-background/90"
                disabled={backgroundUploading}
                onClick={() => backgroundInputRef.current?.click()}
              >
                <IconPhoto size={14} className="mr-1.5" />
                {team.backgroundUrl ? "Change" : "Upload"}
              </Button>
              {team.backgroundUrl ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="bg-background/90"
                  title="Remove background"
                  disabled={backgroundUploading}
                  onClick={() => void removeBackground(team._id)}
                >
                  <IconPhotoOff size={14} />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBackgroundSelected}
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (
            v === "members" ||
            v === "codebases" ||
            v === "env" ||
            v === "artifacts"
          ) {
            navigate({
              to: `/teams/${teamId}/${v}`,
            });
          }
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="codebases">Codebases</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <TeamMembersTab
            teamId={team._id}
            members={members}
            isOwner={isOwner}
          />
        </TabsContent>

        <TabsContent value="codebases">
          <TeamReposTab
            teamId={team._id}
            repos={repos}
            allRepos={allRepos}
            isOwner={isOwner}
          />
        </TabsContent>

        <TabsContent value="env">
          <TeamEnvVarsTab teamId={team._id} teamEnvVars={teamEnvVars} />
        </TabsContent>

        <TabsContent value="artifacts">
          <TeamArtifactsTab teamId={team._id} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
