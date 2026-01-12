import { FeatureDetailClient } from "./FeatureDetailClient";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = await params;
  return <FeatureDetailClient featureId={featureId} />;
}
