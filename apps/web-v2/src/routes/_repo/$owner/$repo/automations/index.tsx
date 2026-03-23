import { createFileRoute } from "@tanstack/react-router";
import { IconPlayerPlay } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_repo/$owner/$repo/automations/")({
  component: AutomationsPage,
});

function AutomationsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={<IconPlayerPlay size={24} className="text-muted-foreground" />}
        title="Select an automation to view"
      />
    </div>
  );
}
