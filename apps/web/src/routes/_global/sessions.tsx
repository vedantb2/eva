import { createFileRoute } from "@tanstack/react-router";
import { IconTerminal2 } from "@tabler/icons-react";
import { EmptyState } from "@eva/ui";

export const Route = createFileRoute("/_global/sessions")({
  staticData: { title: "Sessions" },
  component: SessionsGlobalPage,
});

/** Landing for the rail Sessions entry — pick a session from the sidebar. */
function SessionsGlobalPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <EmptyState
        icon={<IconTerminal2 size={28} />}
        title="Select a session"
        description="Choose a session from the sidebar, or use + on an app to start a new one."
      />
    </div>
  );
}
