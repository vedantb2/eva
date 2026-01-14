import { createSearchParamsCache, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  // Filter params for plans/features
  states: parseAsString.withDefault(""),
  statuses: parseAsString.withDefault(""),
  sortField: parseAsStringLiteral(["created", "title"]).withDefault("created"),
  sortDirection: parseAsStringLiteral(["asc", "desc"]).withDefault("desc"),
  search: parseAsString.withDefault(""),
});
