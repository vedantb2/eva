import { createFileRoute } from "@tanstack/react-router";
import type { Id } from "@conductor/backend";
import { QueryDetailClient } from "./QueryDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/analyse/query/$id")({
  params: {
    parse: (raw): { id: Id<"researchQueries"> } => ({
      id: raw.id as Id<"researchQueries">,
    }),
    stringify: (params) => ({ id: params.id }),
  },
  component: QueryDetailClient,
});
