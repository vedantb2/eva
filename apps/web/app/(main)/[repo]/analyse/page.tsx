import { IconBrain } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export default function ResearchPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={IconBrain}
        title="Select a query or create a new one to get started"
      />
    </div>
  );
}
