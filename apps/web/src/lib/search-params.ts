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

const sandboxTabs = [
  "preview",
  "browser",
  "editor",
  "terminal",
  "computer",
  "pr",
  "files",
  "prd",
] as const;
export type SandboxTab = (typeof sandboxTabs)[number];

// Full sandbox path of the file open in the session File Viewer tab, persisted
// in the URL so a viewed file survives reload and is shareable.
export const fileViewerPathParser = parseAsString
  .withDefault("")
  .withOptions(searchOptions);

export function isSessionSandboxTab(s: string): s is SandboxTab {
  return sandboxTabs.some((tab) => tab === s);
}

/** Old Computer-tab URL segment; redirect to `computer`. */
export function isLegacyDesktopSandboxTab(s: string): boolean {
  return s === "desktop";
}

/** Old Diffs-tab URL segment; redirect to `pr/diffs`. */
export function isLegacyDiffsSandboxTab(s: string): boolean {
  return s === "diffs";
}

const taskRouteSandboxTabs = [
  "preview",
  "browser",
  "editor",
  "terminal",
  "computer",
  "pr",
  "files",
] as const;
export type TaskRouteSandboxTab = (typeof taskRouteSandboxTabs)[number];

export function isTaskRouteSandboxTab(s: string): s is TaskRouteSandboxTab {
  return taskRouteSandboxTabs.some((tab) => tab === s);
}

const prPanelTabs = ["diffs", "recap"] as const;
export type PrPanelTab = (typeof prPanelTabs)[number];

export function isPrPanelTab(s: string): s is PrPanelTab {
  return prPanelTabs.some((tab) => tab === s);
}

// Layout for the Diffs tab — path segment on sessions (`/pr/diffs/unified`).
const diffViews = ["unified", "split"] as const;
export type DiffView = (typeof diffViews)[number];
export function isDiffView(s: string): s is DiffView {
  return s === "unified" || s === "split";
}
export const diffViewParser = parseAsStringLiteral(diffViews)
  .withDefault("unified")
  .withOptions(tabOptions);

/**
 * Nuqs's TanStack adapter used to do `to: pathname + '?diffFile=…'`. TanStack
 * resolvePath keeps the `?…` inside `$sandboxTab`, so beforeLoad must peel it
 * off and redirect to a clean tab + real search params.
 */
export function splitCorruptedSandboxTabParam(raw: string): {
  tab: string;
  diffFile?: string;
  diffView?: DiffView;
} | null {
  const q = raw.indexOf("?");
  if (q === -1) return null;
  const tab = raw.slice(0, q);
  const params = new URLSearchParams(raw.slice(q + 1));
  const diffFileRaw = params.get("diffFile");
  let diffFile: string | undefined;
  if (diffFileRaw !== null) {
    try {
      // Old nuqs serialize double-encoded; decode until stable or one pass.
      diffFile = diffFileRaw.includes("%")
        ? decodeURIComponent(diffFileRaw)
        : diffFileRaw;
    } catch {
      diffFile = diffFileRaw;
    }
  }
  const diffViewRaw = params.get("diffView");
  const diffView: DiffView | undefined =
    diffViewRaw === "unified" || diffViewRaw === "split"
      ? diffViewRaw
      : undefined;
  return { tab, diffFile, diffView };
}

/** Search fields used by the PR/Diffs tab (quick-tasks validateSearch must allow these). */
export function parseDiffSearchFields(search: {
  diffFile?: string;
  diffView?: string;
  prTab?: string;
}): {
  diffFile: string | undefined;
  diffView: DiffView | undefined;
  prTab: PrPanelTab | undefined;
} {
  return {
    diffFile: typeof search.diffFile === "string" ? search.diffFile : undefined,
    diffView:
      search.diffView === "unified" || search.diffView === "split"
        ? search.diffView
        : undefined,
    prTab:
      typeof search.prTab === "string" && isPrPanelTab(search.prTab)
        ? search.prTab
        : undefined,
  };
}

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

const snapshotSettingsTabs = [
  "configuration",
  "status",
  "builds",
  "config-files",
] as const;
export type SnapshotSettingsTab = (typeof snapshotSettingsTabs)[number];

export function isSnapshotSettingsTab(s: string): s is SnapshotSettingsTab {
  return snapshotSettingsTabs.some((tab) => tab === s);
}

const docViewerTabs = ["content", "html"] as const;
export type DocViewerTab = (typeof docViewerTabs)[number];

export function isDocViewerTab(s: string): s is DocViewerTab {
  return docViewerTabs.some((tab) => tab === s);
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
  return automationTabs.some((tab) => tab === s);
}

export const AUTOMATION_DEFAULT_TAB: AutomationTab = "latest";

const inboxFilters = ["all", "unread"] as const;
export const inboxFilterParser = parseAsStringLiteral(inboxFilters)
  .withDefault("all")
  .withOptions(searchOptions);

const docListFilters = ["documents", "pr-recaps"] as const;
export type DocListFilter = (typeof docListFilters)[number];
export const docListFilterParser = parseAsStringLiteral(docListFilters)
  .withDefault("documents")
  .withOptions(searchOptions);

export const DOC_RECAP_DEFAULT_TAB: DocViewerTab = "html";

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
  return envVarScopes.some((scope) => scope === s);
}

const teamDetailTabs = ["members", "codebases", "env", "artifacts"] as const;
export type TeamDetailTab = (typeof teamDetailTabs)[number];

export function isTeamDetailTab(s: string): s is TeamDetailTab {
  return teamDetailTabs.some((tab) => tab === s);
}

export const logEntityTypesParser = parseAsArrayOf(parseAsString)
  .withDefault([])
  .withOptions(searchOptions);

const logViews = ["type", "project"] as const;
export const logViewParser = parseAsStringLiteral(logViews)
  .withDefault("type")
  .withOptions(searchOptions);
