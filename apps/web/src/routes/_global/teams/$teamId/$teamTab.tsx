import { createFileRoute, redirect } from "@tanstack/react-router";
import { TeamDetailClient } from "../TeamDetailClient";
import { isTeamDetailTab } from "@/lib/search-params";

export const Route = createFileRoute("/_global/teams/$teamId/$teamTab")({
  beforeLoad: ({ params }) => {
    // Legacy bookmark: /teams/:id/repos → /teams/:id/codebases
    if (params.teamTab === "repos") {
      throw redirect({
        to: "/teams/$teamId/$teamTab",
        params: {
          teamId: params.teamId,
          teamTab: "codebases",
        },
        replace: true,
      });
    }
    if (!isTeamDetailTab(params.teamTab)) {
      throw redirect({
        to: "/teams/$teamId/$teamTab",
        params: {
          teamId: params.teamId,
          teamTab: "members",
        },
      });
    }
  },
  component: TeamDetailTabRoute,
});

function TeamDetailTabRoute() {
  const { teamId, teamTab } = Route.useParams();
  if (!isTeamDetailTab(teamTab)) {
    return null;
  }
  return <TeamDetailClient teamId={teamId} tab={teamTab} />;
}
