import { createFileRoute } from "@tanstack/react-router";
import { IconBrain } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_repo/$owner/$repo/analyse/")({
  component: AnalyseIndexPage,
});

function AnalyseIndexPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={<IconBrain size={24} className="text-muted-foreground" />}
        title="Select a query or create a new one to get started"
      />
    </div>
  );
}
