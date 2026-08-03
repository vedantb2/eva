import { createFileRoute } from "@tanstack/react-router";
import { IconFileText } from "@tabler/icons-react";
import { EmptyState } from "@eva/ui";

export const Route = createFileRoute("/_repo/$owner/$repo/testing-arena/")({
  staticData: { title: "Testing Arena" },
  component: TestingArenaPage,
});

function TestingArenaPage() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <EmptyState
        icon={<IconFileText size={24} className="text-muted-foreground" />}
        title="Select a document to test"
      />
    </div>
  );
}
