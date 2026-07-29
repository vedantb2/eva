import { createFileRoute } from "@tanstack/react-router";
import { IconPalette } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_repo/$owner/$repo/designs/")({
  staticData: { title: "Designs" },
  component: DesignsIndexPage,
});

function DesignsIndexPage() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <EmptyState
        icon={<IconPalette size={24} className="text-muted-foreground" />}
        title="Select a design session to view"
      />
    </div>
  );
}
