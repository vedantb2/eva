import {
  parseAsString,
  parseAsStringLiteral,
  parseAsArrayOf,
  parseAsInteger,
} from "nuqs";

const searchOptions = { history: "replace" as const };
const tabOptions = { history: "push" as const };

export const searchParser = parseAsString
  .withDefault("")
  .withOptions(searchOptions);

const taskStatuses = [
  "todo",
  "in_progress",
  "business_review",
  "code_review",
  "done",
] as const;
export const statusesParser = parseAsArrayOf(parseAsStringLiteral(taskStatuses))
  .withDefault([...taskStatuses])
  .withOptions(searchOptions);

const projectPhases = ["draft", "finalized", "active", "completed"] as const;
export const phasesParser = parseAsArrayOf(parseAsStringLiteral(projectPhases))
  .withDefault([...projectPhases])
  .withOptions(searchOptions);

const sortFields = ["created", "title"] as const;
export const sortFieldParser = parseAsStringLiteral(sortFields)
  .withDefault("created")
  .withOptions(searchOptions);

const sortDirections = ["asc", "desc"] as const;
export const sortDirParser = parseAsStringLiteral(sortDirections)
  .withDefault("desc")
  .withOptions(searchOptions);

const timeRanges = ["7d", "30d", "90d", "all"] as const;
export const timeRangeParser = parseAsStringLiteral(timeRanges)
  .withDefault("30d")
  .withOptions(searchOptions);

const repoStatsRanges: ["1d", "3d", "1w", "1m", "3m", "6m", "1y", "all"] = [
  "1d",
  "3d",
  "1w",
  "1m",
  "3m",
  "6m",
  "1y",
  "all",
];
export const repoStatsRangeParser = parseAsStringLiteral(repoStatsRanges)
  .withDefault("all")
  .withOptions(searchOptions);

const sandboxTabs = ["preview", "editor", "terminal"] as const;
export const sandboxTabParser = parseAsStringLiteral(sandboxTabs)
  .withDefault("preview")
  .withOptions(tabOptions);

const sessionModes = ["execute", "ask", "plan"] as const;
export const sessionModeParser = parseAsStringLiteral(sessionModes)
  .withDefault("execute")
  .withOptions(tabOptions);

export const designTabParser = parseAsString
  .withDefault("0")
  .withOptions(tabOptions);

const viewModes = ["desktop", "mobile"] as const;
export const viewModeParser = parseAsStringLiteral(viewModes)
  .withDefault("desktop")
  .withOptions(tabOptions);

const testingTabs = ["code", "ui"] as const;
export const testingTabParser = parseAsStringLiteral(testingTabs)
  .withDefault("code")
  .withOptions(tabOptions);

const inboxFilters = ["all", "unread"] as const;
export const inboxFilterParser = parseAsStringLiteral(inboxFilters)
  .withDefault("all")
  .withOptions(searchOptions);

const projectViews = ["kanban", "timeline", "list"] as const;
export const projectViewParser = parseAsStringLiteral(projectViews)
  .withDefault("kanban")
  .withOptions(tabOptions);

const quickTaskViews = ["kanban", "list"] as const;
export const quickTaskViewParser = parseAsStringLiteral(quickTaskViews)
  .withDefault("kanban")
  .withOptions(tabOptions);

export const previewPortParser = parseAsInteger
  .withDefault(3001)
  .withOptions(searchOptions);

export const branchParser = parseAsString
  .withDefault("main")
  .withOptions(searchOptions);
