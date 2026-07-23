import { createFileRoute } from "@tanstack/react-router";
import { IconTerminal2 } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_global/sessions")({
  component: SessionsGlobalPage,
});

/** Landing for the rail Sessions entry — pick a session from the sidebar. */
function SessionsGlobalPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <EmptyState
        icon={<IconTerminal2 size={28} />}
        title="Select a session"
        description="Choose a session from the sidebar, or use + on an app to start a new one."
      />
    </div>
  );
}
