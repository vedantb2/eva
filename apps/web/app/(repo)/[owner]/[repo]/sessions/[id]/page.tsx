import { Id } from "@conductor/backend";
import { SessionDetailClient } from "./SessionDetailClient";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: Id<"sessions"> }>;
}) {
  const { id } = await params;
  return <SessionDetailClient sessionId={id} />;
}
