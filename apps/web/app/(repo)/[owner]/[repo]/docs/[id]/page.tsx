"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { DocViewer } from "@/lib/components/docs/DocViewer";
import { isConvexId } from "@/lib/type-guards";
import { Spinner } from "@conductor/ui";

export default function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const doc = useQuery(api.docs.get, isConvexId<"docs">(id) ? { id } : "skip");

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>Document not found</p>
      </div>
    );
  }

  return <DocViewer doc={doc} />;
}
