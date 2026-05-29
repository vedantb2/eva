import { createFileRoute } from "@tanstack/react-router";
import { QuickTaskTaskLayout } from "../_components/QuickTaskTaskLayout";

export const Route = createFileRoute("/_repo/$owner/$repo/quick-tasks/$taskId")(
  {
    component: QuickTaskTaskLayoutRoute,
  },
);

function QuickTaskTaskLayoutRoute() {
  const { taskId } = Route.useParams();
  return <QuickTaskTaskLayout taskId={taskId} />;
}
