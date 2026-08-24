export type { Id, Doc } from "./convex/_generated/dataModel";
export type { BackgroundAgentEntry } from "./convex/_validators/tableFields";
export type { SandboxOwner } from "./convex/_sandbox/owner";
export { api } from "./convex/_generated/api";
export { GITHUB_AUTH_REQUIRED } from "./convex/_github/authErrors";
export { DAILY_STANDUP_KEY } from "./convex/_automations/systemAutomations";
export {
  AI_MODEL_OPTIONS,
  DEFAULT_AI_MODEL,
  CODEX_AUTH_ENV_KEYS,
  OPENCODE_AUTH_ENV_KEYS,
  CURSOR_AUTH_ENV_KEYS,
  findAIModelOption,
  getAIModelProvider,
  getVisibleAIModelOptions,
  getSimpleViewModelOptions,
  SIMPLE_VIEW_MODEL_LADDER,
  snapToSimpleViewLadder,
  getModelTraits,
  resolveTraitsForDisplay,
  buildTraitsExecutionPayload,
  modelHasTraits,
  getReasoningLevelLabel,
  normalizeAIModel,
  storedTraitsFromRepoDefaults,
  type AIModel,
  type AIProvider,
  type ReasoningLevel,
  type StoredModelTraits,
  type ModelTraitsExecutionArgs,
  PERSONALISATION_PRESETS,
  SHORTCUT_DEFS,
  SHORTCUT_IDS,
  SHORTCUT_SECTIONS,
  shortcutDef,
  type ShortcutDef,
  type ShortcutId,
} from "./convex/validators";
