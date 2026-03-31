import { createFileRoute } from "@tanstack/react-router";
import { IconFileText } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_repo/$owner/$repo/docs/")({
  component: DocsIndexPage,
});

function DocsIndexPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={<IconFileText size={24} className="text-muted-foreground" />}
        title="Select a document to view"
      />
    </div>
  );
}
