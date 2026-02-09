import { DesignDetailClient } from "./DesignDetailClient";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DesignDetailClient designSessionId={id} />;
}
