import { TeamDetailClient } from "./TeamDetailClient";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
