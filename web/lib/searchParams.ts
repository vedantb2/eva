import { createSearchParamsCache, parseAsString, parseAsStringEnum } from "nuqs/server";

// Plan page query params
export const plansSortFieldParser = parseAsStringEnum(["created", "title"]).withDefault("created");
export const plansSortDirectionParser = parseAsStringEnum(["asc", "desc"]).withDefault("desc");
export const plansVisibleStatesParser = parseAsString.withDefault("draft,finalized,feature_created");
export const plansSearchQueryParser = parseAsString.withDefault("");

// Features page query params
export const featuresSortFieldParser = parseAsStringEnum(["created", "title"]).withDefault("created");
export const featuresSortDirectionParser = parseAsStringEnum(["asc", "desc"]).withDefault("desc");
export const featuresVisibleStatusesParser = parseAsString.withDefault("planning,active,completed");
export const featuresSearchQueryParser = parseAsString.withDefault("");

// Kanban/Tasks query params
export const kanbanSearchQueryParser = parseAsString.withDefault("");
export const kanbanVisibleStatusesParser = parseAsString.withDefault("todo,in_progress,code_review,done");

// Create caches for server-side access
export const plansSearchParamsCache = createSearchParamsCache({
  sortField: plansSortFieldParser,
  sortDirection: plansSortDirectionParser,
  visibleStates: plansVisibleStatesParser,
  searchQuery: plansSearchQueryParser,
});

export const featuresSearchParamsCache = createSearchParamsCache({
  sortField: featuresSortFieldParser,
  sortDirection: featuresSortDirectionParser,
  visibleStatuses: featuresVisibleStatusesParser,
  searchQuery: featuresSearchQueryParser,
});

export const kanbanSearchParamsCache = createSearchParamsCache({
  searchQuery: kanbanSearchQueryParser,
  visibleStatuses: kanbanVisibleStatusesParser,
});
