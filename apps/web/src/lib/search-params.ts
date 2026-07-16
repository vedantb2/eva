import {
  parseAsBoolean,
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
  "cancelled",
] as const;
export const statusesParser = parseAsArrayOf(parseAsStringLiteral(taskStatuses))
  .withDefault([...taskStatuses])
  .withOptions(searchOptions);

const projectPhases = [
  "draft",
  "finalized",
  "in_progress",
  "business_review",
  "code_review",
  "completed",
  "cancelled",
] as const;
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

const sandboxTabs = [
  "preview",
  "editor",
  "terminal",
  "desktop",
  "diffs",
  "prd",
] as const;
export type SandboxTab = (typeof sandboxTabs)[number];

export function isSessionSandboxTab(s: string): s is SandboxTab {
  return (sandboxTabs as readonly string[]).includes(s);
}

const taskRouteSandboxTabs = [
  "preview",
  "editor",
  "terminal",
  "desktop",
  "diffs",
] as const;
export type TaskRouteSandboxTab = (typeof taskRouteSandboxTabs)[number];

export function isTaskRouteSandboxTab(s: string): s is TaskRouteSandboxTab {
  return (taskRouteSandboxTabs as readonly string[]).includes(s);
}

// Layout for the Diffs tab, persisted in the URL so it survives reloads/sharing.
const diffViews = ["unified", "split"] as const;
export type DiffView = (typeof diffViews)[number];
export const diffViewParser = parseAsStringLiteral(diffViews)
  .withDefault("unified")
  .withOptions(tabOptions);

export const sandboxOpenParser = parseAsBoolean
  .withDefault(false)
  .withOptions(tabOptions);

export const designVariationParser = parseAsString
  .withDefault("0")
  .withOptions(tabOptions);

const viewModes = ["desktop", "mobile"] as const;
export const viewModeParser = parseAsStringLiteral(viewModes)
  .withDefault("desktop")
  .withOptions(tabOptions);

const testingTabs = ["code", "ui"] as const;
export type TestingArenaTab = (typeof testingTabs)[number];

export function isTestingArenaTab(s: string): s is TestingArenaTab {
  return (testingTabs as readonly string[]).includes(s);
}

const snapshotSettingsTabs = [
  "configuration",
  "status",
  "builds",
  "config-files",
] as const;
export type SnapshotSettingsTab = (typeof snapshotSettingsTabs)[number];

export function isSnapshotSettingsTab(s: string): s is SnapshotSettingsTab {
  return (snapshotSettingsTabs as readonly string[]).includes(s);
}

const docViewerTabs = ["content", "html"] as const;
export type DocViewerTab = (typeof docViewerTabs)[number];

export function isDocViewerTab(s: string): s is DocViewerTab {
  return (docViewerTabs as readonly string[]).includes(s);
}

export const DOC_VIEWER_DEFAULT_TAB: DocViewerTab = "content";

const docModes = ["editing", "suggesting", "viewing"] as const;
export type DocMode = (typeof docModes)[number];
export const docModeParser = parseAsStringLiteral(docModes)
  .withDefault("editing")
  .withOptions(searchOptions);

const docCommentFilters = ["open", "resolved"] as const;
export type DocCommentFilter = (typeof docCommentFilters)[number];
export const docCommentFilterParser = parseAsStringLiteral(docCommentFilters)
  .withDefault("open")
  .withOptions(searchOptions);

const automationTabs = ["latest", "run-history", "settings"] as const;
export type AutomationTab = (typeof automationTabs)[number];

export function isAutomationTab(s: string): s is AutomationTab {
  return (automationTabs as readonly string[]).includes(s);
}

export const AUTOMATION_DEFAULT_TAB: AutomationTab = "latest";

const inboxFilters = ["all", "unread"] as const;
export const inboxFilterParser = parseAsStringLiteral(inboxFilters)
  .withDefault("all")
  .withOptions(searchOptions);

const docListFilters = ["all", "documents", "pr-recaps"] as const;
export type DocListFilter = (typeof docListFilters)[number];
export const docListFilterParser = parseAsStringLiteral(docListFilters)
  .withDefault("all")
  .withOptions(searchOptions);

export const DOC_RECAP_DEFAULT_TAB: DocViewerTab = "content";

const projectViews = ["kanban", "timeline", "list", "table"] as const;
export const projectViewParser = parseAsStringLiteral(projectViews)
  .withDefault("kanban")
  .withOptions(tabOptions);

export const previewPortParser = parseAsInteger.withOptions(searchOptions);

export const branchParser = parseAsString
  .withDefault("main")
  .withOptions(searchOptions);

const envVarScopes = ["repo", "team"] as const;
export type EnvVarScope = (typeof envVarScopes)[number];

export function isEnvVarScope(s: string): s is EnvVarScope {
  return (envVarScopes as readonly string[]).includes(s);
}

const teamDetailTabs = ["members", "repos", "env", "artifacts"] as const;
export type TeamDetailTab = (typeof teamDetailTabs)[number];

export function isTeamDetailTab(s: string): s is TeamDetailTab {
  return (teamDetailTabs as readonly string[]).includes(s);
}

export const logEntityTypesParser = parseAsArrayOf(parseAsString)
  .withDefault([])
  .withOptions(searchOptions);

const logViews = ["type", "project"] as const;
export const logViewParser = parseAsStringLiteral(logViews)
  .withDefault("type")
  .withOptions(searchOptions);
