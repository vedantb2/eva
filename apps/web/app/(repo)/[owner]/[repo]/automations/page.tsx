import { IconPlayerPlay } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export default function AutomationsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={<IconPlayerPlay size={24} className="text-muted-foreground" />}
        title="Select an automation to view"
      />
    </div>
  );
}
