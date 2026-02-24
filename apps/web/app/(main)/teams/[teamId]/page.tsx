import { TeamDetailClient } from "./TeamDetailClient";

export default function TeamDetailPage({
  params,
}: {
  params: { teamId: string };
}) {
  return <TeamDetailClient teamId={params.teamId} />;
}
