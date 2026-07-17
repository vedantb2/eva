import { useRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { TeamDetailTab } from "@/lib/search-params";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useTeamLogoUpload } from "@/lib/hooks/useTeamLogoUpload";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
} from "@conductor/ui";
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
  const { uploadLogo, removeLogo, uploading } = useTeamLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconPhoto size={14} className="mr-1.5" />
            {team.logoUrl ? "Change logo" : "Set logo"}
          </Button>
          {team.logoUrl ? (
            <Button
              size="icon-sm"
              variant="ghost"
              title="Remove logo"
              disabled={uploading}
              onClick={() => void removeLogo(team._id)}
            >
              <IconPhotoOff size={14} />
            </Button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelected}
          />
        </div>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (
            v === "members" ||
            v === "repos" ||
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
          <TabsTrigger value="repos">Codebases</TabsTrigger>
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

        <TabsContent value="repos">
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
