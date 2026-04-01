import { createFileRoute } from "@tanstack/react-router";
import { IconRefresh } from "@tabler/icons-react";

export const Route = createFileRoute("/_repo/$owner/$repo/analyse/routines")({
  component: RoutinesPage,
});

function RoutinesPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <IconRefresh className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Routines coming soon</p>
      </div>
    </div>
  );
}
