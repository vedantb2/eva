import { useRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { isTeamDetailTab, type TeamDetailTab } from "@/lib/search-params";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useTeamLogoUpload } from "@/lib/hooks/useTeamLogoUpload";
import { useTeamBackgroundUpload } from "@/lib/hooks/useTeamBackgroundUpload";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  Button,
} from "@eva/ui";
import { IconUsers, IconPhoto, IconPhotoOff } from "@tabler/icons-react";
import { TeamActivityTab } from "./_components/TeamActivityTab";
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
              <div className="flex size-7 items-center justify-center rounded-control border border-border bg-muted">
                <IconUsers size={14} className="text-muted-foreground" />
              </div>
            }
          />
          <span className="truncate">{displayName}</span>
        </span>
      }
      comfortable
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
      tabs={
        <Tabs
          value={tab}
          onValueChange={(v) => {
            if (isTeamDetailTab(v)) {
              navigate({
                to: `/teams/${teamId}/${v}`,
              });
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="codebases">Codebases</TabsTrigger>
            <TabsTrigger value="env">Env Variables</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <SettingsSection
        title="Sidebar background"
        description="Shown behind the team name in the sidebar."
        className="mb-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-control border border-border bg-muted">
            {team.backgroundUrl ? (
              <img
                src={team.backgroundUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <IconPhoto size={14} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="outline"
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
                title="Remove background"
                disabled={backgroundUploading}
                onClick={() => void removeBackground(team._id)}
              >
                <IconPhotoOff size={14} />
              </Button>
            ) : null}
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundSelected}
            />
          </div>
        </div>
      </SettingsSection>

      {tab === "activity" ? <TeamActivityTab members={members} /> : null}
      {tab === "members" ? (
        <TeamMembersTab
          teamId={team._id}
          members={members}
          isOwner={isOwner}
        />
      ) : null}
      {tab === "codebases" ? (
        <TeamReposTab
          teamId={team._id}
          repos={repos}
          allRepos={allRepos}
          isOwner={isOwner}
        />
      ) : null}
      {tab === "env" ? (
        <TeamEnvVarsTab teamId={team._id} teamEnvVars={teamEnvVars} />
      ) : null}
      {tab === "artifacts" ? <TeamArtifactsTab teamId={team._id} /> : null}
    </PageWrapper>
  );
}
