import type { ReasoningLevel, StoredModelTraits } from "@eva/backend";

/** The run-trait fields as they are stored on (and written to) a task. */
interface TaskRunTraits {
  reasoningLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
  fastMode?: boolean;
}

/** Task run traits in the shape the traits menu reads. */
export function taskRunTraits(
  task: TaskRunTraits | undefined,
): StoredModelTraits {
  return {
    effortLevel: task?.reasoningLevel,
    thinkingEnabled: task?.thinkingEnabled,
    use1mContext: task?.use1mContext,
    fastMode: task?.fastMode,
  };
}

/**
 * Menu traits in the shape the task mutations take. Only set traits are
 * included, so a one-trait change writes (and optimistically patches) that
 * trait alone and leaves the rest on the task untouched.
 */
export function toRunTraitArgs(traits: StoredModelTraits): TaskRunTraits {
  return {
    ...(traits.effortLevel !== undefined
      ? { reasoningLevel: traits.effortLevel }
      : {}),
    ...(traits.thinkingEnabled !== undefined
      ? { thinkingEnabled: traits.thinkingEnabled }
      : {}),
    ...(traits.use1mContext !== undefined
      ? { use1mContext: traits.use1mContext }
      : {}),
    ...(traits.fastMode !== undefined ? { fastMode: traits.fastMode } : {}),
  };
}
