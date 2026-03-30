import { QuickTaskDetailClient } from "./QuickTaskDetailClient";

export default async function QuickTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <QuickTaskDetailClient taskId={taskId} />;
}
