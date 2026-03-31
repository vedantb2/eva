import { createFileRoute } from "@tanstack/react-router";
import { IconFolder } from "@tabler/icons-react";

export const Route = createFileRoute("/_repo/$owner/$repo/analyse/files")({
  component: FilesPage,
});

function FilesPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <IconFolder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Files browser coming soon</p>
      </div>
    </div>
  );
}
