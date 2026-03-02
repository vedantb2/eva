import { Id } from "@conductor/backend";
import { DesignDetailClient } from "./DesignDetailClient";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: Id<"designSessions"> }>;
}) {
  const { id } = await params;
  return <DesignDetailClient designSessionId={id} />;
}
