"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { DocViewer } from "@/lib/components/docs/DocViewer";

export default function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const doc = useQuery(api.docs.get, { id: id as Id<"docs"> });

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-neutral-400">
        <p>Document not found</p>
      </div>
    );
  }

  return <DocViewer doc={doc} />;
}
