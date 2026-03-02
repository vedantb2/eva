import { QueryDetailClient } from "./QueryDetailClient";

export default async function QueryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QueryDetailClient queryId={id} />;
}
