import { createFileRoute } from "@tanstack/react-router";
import { TeamDetailClient } from "./TeamDetailClient";

export const Route = createFileRoute("/_global/teams/$teamId")({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { teamId } = Route.useParams();
  return <TeamDetailClient teamId={teamId} />;
}
