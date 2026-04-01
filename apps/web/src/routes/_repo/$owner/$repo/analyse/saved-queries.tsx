import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Button, Spinner, Card, CardContent } from "@conductor/ui";
import {
  IconBookmark,
  IconTrash,
  IconCode,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@conductor/ui";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/analyse/saved-queries",
)({
  component: SavedQueriesPage,
});

function SavedQueriesPage() {
  const { repo } = useRepo();
  const savedQueries = useQuery(api.savedQueries.list, { repoId: repo._id });
  const removeSavedQuery = useMutation(api.savedQueries.remove);

  const handleDelete = async (id: Id<"savedQueries">) => {
    await removeSavedQuery({ id });
  };

  if (savedQueries === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (savedQueries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <IconBookmark className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No saved queries yet</p>
          <p className="text-xs text-muted-foreground">
            Save queries from your research conversations to reuse them later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-foreground">Saved Queries</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {savedQueries.length} saved{" "}
          {savedQueries.length === 1 ? "query" : "queries"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {savedQueries.map((sq) => (
          <Card key={sq._id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {sq.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(sq.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(sq._id)}
                >
                  <IconTrash size={14} />
                </Button>
              </div>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                  <IconCode size={14} />
                  <span>View query</span>
                  <IconChevronDown
                    size={12}
                    className="transition-transform group-data-[state=open]:rotate-180"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 rounded-lg bg-secondary p-3 text-xs overflow-x-auto">
                    <code>{sq.query}</code>
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
