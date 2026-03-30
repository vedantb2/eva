"use client";

import { use } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { DocViewer } from "@/lib/components/docs/DocViewer";
import { Spinner } from "@conductor/ui";

export default function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const doc = useQuery(api.docs.get, { id: id as Id<"docs"> });

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
