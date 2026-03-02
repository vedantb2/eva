import { QuickTasksClient } from "../QuickTasksClient";

export default async function QuickTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <QuickTasksClient initialTaskId={taskId} />;
}
