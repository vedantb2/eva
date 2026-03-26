import { useQueryState } from "nuqs";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { teamDetailTabParser } from "@/lib/search-params";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@conductor/ui";
import { TeamMembersTab } from "./_components/TeamMembersTab";
import { TeamReposTab } from "./_components/TeamReposTab";
import { TeamEnvVarsTab } from "./_components/TeamEnvVarsTab";

interface TeamDetailClientProps {
  teamId: string;
}

export function TeamDetailClient({ teamId }: TeamDetailClientProps) {
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

  const [tab, setTab] = useQueryState("tab", teamDetailTabParser);

  if (!team) {
    return (
      <PageWrapper title="Team">
        <p className="text-sm text-muted-foreground">Team not found</p>
      </PageWrapper>
    );
  }

  const isOwner = team.userRole === "owner";

  return (
    <PageWrapper title={team.displayName ?? team.name}>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (v === "members" || v === "repos" || v === "env") setTab(v);
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
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
      </Tabs>
    </PageWrapper>
  );
}
