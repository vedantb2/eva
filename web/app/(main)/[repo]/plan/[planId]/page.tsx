import { PlanDetailClient } from "./PlanDetailClient";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <PlanDetailClient planId={planId} />;
}
