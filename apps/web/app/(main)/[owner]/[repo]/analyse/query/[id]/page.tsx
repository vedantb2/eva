import type { Id } from "@conductor/backend";
import { QueryDetailClient } from "./QueryDetailClient";

export default async function QueryDetailPage({
  params,
}: {
  params: Promise<{ id: Id<"researchQueries"> }>;
}) {
  const { id } = await params;
  return <QueryDetailClient queryId={id} />;
}
