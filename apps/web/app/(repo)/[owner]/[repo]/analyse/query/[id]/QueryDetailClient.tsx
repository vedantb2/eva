"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { QueryConversation } from "./_components/QueryConversation";
import { QuerySavedSidebar } from "./_components/QuerySavedSidebar";

interface QueryDetailClientProps {
  queryId: Id<"researchQueries">;
}

export function QueryDetailClient({ queryId }: QueryDetailClientProps) {
  const { repo } = useRepo();
  const researchQuery = useQuery(api.researchQueries.get, { id: queryId });

  if (researchQuery === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (researchQuery === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          This query does not exist or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <QueryConversation
        queryId={queryId}
        title={researchQuery.title}
        repoId={repo._id}
        installationId={repo.installationId}
      />
      <QuerySavedSidebar repoId={repo._id} />
    </div>
  );
}
