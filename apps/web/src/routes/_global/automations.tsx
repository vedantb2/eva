import { createFileRoute } from "@tanstack/react-router";
import { IconPlayerPlay } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_global/automations")({
  staticData: { title: "Automations" },
  component: AutomationsGlobalPage,
});

/** Landing for the rail Automations entry — pick an automation from the sidebar. */
function AutomationsGlobalPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <EmptyState
        icon={<IconPlayerPlay size={28} />}
        title="Select an automation"
        description="Choose one from the sidebar, or use + on an app to create one."
      />
    </div>
  );
}
