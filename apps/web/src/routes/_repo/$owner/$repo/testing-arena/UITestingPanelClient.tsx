import { IconWorld } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export function UITestingPanel() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <EmptyState
        icon={<IconWorld size={24} className="text-primary" />}
        title="UI testing is coming soon"
        description="Eva will open your app in a browser and verify user flows against this document."
      />
    </div>
  );
}
