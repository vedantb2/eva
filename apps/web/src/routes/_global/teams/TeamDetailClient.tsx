import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { TeamDetailTab } from "@/lib/search-params";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@conductor/ui";
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
  const typedTeamId = teamId as Id<"teams">;
  const team = useQuery(api.teams.get, { id: typedTeamId });
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

  if (!team) {
    return (
      <PageWrapper title="Team">
        <EntityNotFound entityLabel="team" backTo="/teams" />
      </PageWrapper>
    );
  }

  const isOwner = team.userRole === "owner";

  return (
    <PageWrapper title={team.displayName ?? team.name}>
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
