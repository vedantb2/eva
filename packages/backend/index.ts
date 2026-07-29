export type { Id, Doc } from "./convex/_generated/dataModel";
export type { BackgroundAgentEntry } from "./convex/_validators/tableFields";
export { api } from "./convex/_generated/api";
export {
  AI_MODEL_OPTIONS,
  DEFAULT_AI_MODEL,
  CODEX_AUTH_ENV_KEYS,
  OPENCODE_AUTH_ENV_KEYS,
  CURSOR_AUTH_ENV_KEYS,
  findAIModelOption,
  getAIModelProvider,
  getVisibleAIModelOptions,
  getModelTraits,
  resolveTraitsForDisplay,
  buildTraitsExecutionPayload,
  modelHasTraits,
  getReasoningLevelLabel,
  normalizeAIModel,
  type AIModel,
  type AIProvider,
  type ReasoningLevel,
  type StoredModelTraits,
  type ModelTraitsExecutionArgs,
  PERSONALISATION_PRESETS,
} from "./convex/validators";
