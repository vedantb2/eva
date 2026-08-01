export type CursorEvaModel =
  | "cursor:grok-4.5-low"
  | "cursor:grok-4.5-medium"
  | "cursor:grok-4.5-high"
  | "cursor:gpt-5.5-low"
  | "cursor:gemini-3.1-pro"
  | "cursor:composer-2.5";

export type CursorReasoningLevel =
  | "off"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export type EvaSessionMode = "edit" | "ask" | "execute" | "plan" | "design";

export interface CursorCapabilitySelectValue {
  value: string;
  name: string;
  description?: string;
}

export type CursorCapabilityConfigOption =
  | {
      type: "select";
      id: string;
      name: string;
      description?: string;
      category?: string;
      currentValue: string;
      options: ReadonlyArray<CursorCapabilitySelectValue>;
    }
  | {
      type: "boolean";
      id: string;
      name: string;
      description?: string;
      category?: string;
      currentValue: boolean;
    };

export interface CursorAdvertisedModel {
  value: string;
  name: string;
  configOptions: ReadonlyArray<CursorCapabilityConfigOption>;
}

export interface CursorAdvertisedMode {
  id: string;
  name: string;
  description?: string;
}

export type CursorComposerCapability =
  | {
      kind: "select";
      id: "reasoningLevel";
      label: string;
      description: string;
      options: Array<{
        value: CursorReasoningLevel;
        label: string;
      }>;
      defaultValue: CursorReasoningLevel;
    }
  | {
      kind: "boolean";
      id: "thinkingEnabled" | "use1mContext";
      label: string;
      description: string;
      defaultValue: boolean;
    };

export interface CursorTraitRequest {
  reasoningLevel?: CursorReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
}

export interface CursorConfigUpdate {
  configId: string;
  value: string | boolean;
}

const cursorModelPairs: ReadonlyArray<{
  eva: CursorEvaModel;
  cursor: string;
  legacyCursor?: string;
  reasoningLevel?: CursorReasoningLevel;
}> = [
  {
    eva: "cursor:grok-4.5-low",
    cursor: "grok-4.5",
    legacyCursor: "cursor-grok-4.5-low",
    reasoningLevel: "low",
  },
  {
    eva: "cursor:grok-4.5-medium",
    cursor: "grok-4.5",
    legacyCursor: "cursor-grok-4.5-medium",
    reasoningLevel: "medium",
  },
  {
    eva: "cursor:grok-4.5-high",
    cursor: "grok-4.5",
    legacyCursor: "cursor-grok-4.5-high",
    reasoningLevel: "high",
  },
  {
    eva: "cursor:gpt-5.5-low",
    cursor: "gpt-5.5",
    legacyCursor: "gpt-5.5-low",
    reasoningLevel: "low",
  },
  { eva: "cursor:gemini-3.1-pro", cursor: "gemini-3.1-pro" },
  { eva: "cursor:composer-2.5", cursor: "composer-2.5" },
];

function stripCursorPrefix(model: string): string {
  return model.startsWith("cursor:") ? model.slice("cursor:".length) : model;
}

export function cursorModelIdForEva(model: string): string {
  const normalized = stripCursorPrefix(model);
  const match = cursorModelPairs.find(
    (entry) => stripCursorPrefix(entry.eva) === normalized,
  );
  return match?.cursor ?? normalized;
}

/** All Eva variants backed by one Cursor ACP model. */
export function evaModelIdsForCursor(model: string): CursorEvaModel[] {
  const normalized = stripCursorPrefix(model).trim().toLowerCase();
  const exactMatch = cursorModelPairs.find((entry) => {
    const eva = stripCursorPrefix(entry.eva).toLowerCase();
    const legacyCursor = entry.legacyCursor?.toLowerCase();
    return normalized === eva || normalized === legacyCursor;
  });
  if (exactMatch) return [exactMatch.eva];

  const cursorModel = normalized.split("[")[0]?.trim() ?? normalized;
  return cursorModelPairs
    .filter((entry) => entry.cursor.toLowerCase() === cursorModel)
    .map((entry) => entry.eva);
}

export function evaModelIdForCursor(model: string): CursorEvaModel | undefined {
  return evaModelIdsForCursor(model)[0];
}

/** Reasoning encoded in Eva's legacy variant-style Cursor model ids. */
export function cursorReasoningLevelForEvaModel(
  model: string,
): CursorReasoningLevel | undefined {
  const normalized = stripCursorPrefix(model).trim().toLowerCase();
  return cursorModelPairs.find(
    (entry) => stripCursorPrefix(entry.eva).toLowerCase() === normalized,
  )?.reasoningLevel;
}

function normalizedToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}

function normalizedReasoningLevel(
  value: string,
): CursorReasoningLevel | undefined {
  switch (normalizedToken(value)) {
    case "off":
    case "none":
    case "minimal":
      return "off";
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    case "xhigh":
    case "extra-high":
      return "xhigh";
    case "max":
    case "maximum":
      return "max";
    default:
      return undefined;
  }
}

function optionIdentity(option: CursorCapabilityConfigOption): string {
  return normalizedToken(
    `${option.category ?? ""} ${option.id} ${option.name}`,
  );
}

function findReasoningOption(
  options: ReadonlyArray<CursorCapabilityConfigOption>,
): CursorCapabilityConfigOption | undefined {
  return options.find((option) => {
    const identity = optionIdentity(option);
    return (
      option.type === "select" &&
      (identity.includes("thought-level") ||
        identity.includes("reasoning") ||
        identity.includes("effort"))
    );
  });
}

function findThinkingOption(
  options: ReadonlyArray<CursorCapabilityConfigOption>,
): CursorCapabilityConfigOption | undefined {
  return options.find((option) => optionIdentity(option).includes("thinking"));
}

function findContextOption(
  options: ReadonlyArray<CursorCapabilityConfigOption>,
): CursorCapabilityConfigOption | undefined {
  return options.find((option) => {
    const identity = optionIdentity(option);
    return identity.includes("context") || identity.includes("1m");
  });
}

function selectBooleanValue(
  option: CursorCapabilityConfigOption,
  requested: boolean,
): string | boolean | undefined {
  if (option.type === "boolean") return requested;
  const expected = String(requested);
  return option.options.find(
    (value) =>
      normalizedToken(value.value) === expected ||
      normalizedToken(value.name) === expected,
  )?.value;
}

function isExtendedContextValue(value: CursorCapabilitySelectValue): boolean {
  const token = normalizedToken(`${value.value} ${value.name}`);
  return (
    token.includes("1m") ||
    token.includes("1000000") ||
    token.includes("million") ||
    token.includes("extended") ||
    token.includes("maximum")
  );
}

function selectContextValue(
  option: CursorCapabilityConfigOption,
  requested: boolean,
): string | boolean | undefined {
  if (option.type === "boolean") return requested;
  const match = option.options.find((value) => {
    const isExtended = isExtendedContextValue(value);
    return requested ? isExtended : !isExtended;
  });
  return match?.value;
}

function currentContextValue(option: CursorCapabilityConfigOption): boolean {
  if (option.type === "boolean") return option.currentValue;
  const current = option.options.find(
    (value) => value.value === option.currentValue,
  );
  return current ? isExtendedContextValue(current) : false;
}

/** Provider-normalized controls; no ACP wire types cross into React. */
export function cursorComposerCapabilities(
  configOptions: ReadonlyArray<CursorCapabilityConfigOption>,
): CursorComposerCapability[] {
  const controls: CursorComposerCapability[] = [];
  const reasoning = findReasoningOption(configOptions);
  if (reasoning?.type === "select") {
    const seen = new Set<CursorReasoningLevel>();
    const values: Array<{ value: CursorReasoningLevel; label: string }> = [];
    for (const option of reasoning.options) {
      const level =
        normalizedReasoningLevel(option.value) ??
        normalizedReasoningLevel(option.name);
      if (level === undefined || seen.has(level)) continue;
      seen.add(level);
      values.push({ value: level, label: option.name });
    }
    const defaultValue = normalizedReasoningLevel(reasoning.currentValue);
    const first = values[0];
    if (first) {
      controls.push({
        kind: "select",
        id: "reasoningLevel",
        label: reasoning.name || "Reasoning",
        description:
          reasoning.description ?? "How much reasoning Cursor should use.",
        options: values,
        defaultValue: defaultValue ?? first.value,
      });
    }
  }

  const thinking = findThinkingOption(configOptions);
  if (
    thinking &&
    (thinking.type === "boolean" ||
      (selectBooleanValue(thinking, true) !== undefined &&
        selectBooleanValue(thinking, false) !== undefined))
  ) {
    const defaultValue =
      thinking.type === "boolean"
        ? thinking.currentValue
        : normalizedToken(thinking.currentValue) === "true";
    controls.push({
      kind: "boolean",
      id: "thinkingEnabled",
      label: thinking.name || "Thinking",
      description:
        thinking.description ?? "Allow Cursor's extended thinking mode.",
      defaultValue,
    });
  }

  const context = findContextOption(configOptions);
  if (
    context &&
    selectContextValue(context, true) !== undefined &&
    selectContextValue(context, false) !== undefined
  ) {
    controls.push({
      kind: "boolean",
      id: "use1mContext",
      label: context.name || "1M context",
      description:
        context.description ?? "Use Cursor's extended context window.",
      defaultValue: currentContextValue(context),
    });
  }
  return controls;
}

/** Resolves selected normalized traits back to exact advertised Cursor values. */
export function resolveCursorConfigUpdates(
  configOptions: ReadonlyArray<CursorCapabilityConfigOption>,
  request: CursorTraitRequest,
): { updates: ReadonlyArray<CursorConfigUpdate>; unsupported: string[] } {
  const updates: CursorConfigUpdate[] = [];
  const unsupported: string[] = [];

  if (request.reasoningLevel !== undefined) {
    const option = findReasoningOption(configOptions);
    const value =
      option?.type === "select"
        ? option.options.find(
            (candidate) =>
              normalizedReasoningLevel(candidate.value) ===
                request.reasoningLevel ||
              normalizedReasoningLevel(candidate.name) ===
                request.reasoningLevel,
          )?.value
        : undefined;
    if (!option || value === undefined) {
      unsupported.push(`reasoning level ${request.reasoningLevel}`);
    } else {
      updates.push({ configId: option.id, value });
    }
  }

  if (request.thinkingEnabled !== undefined) {
    const option = findThinkingOption(configOptions);
    const value = option
      ? selectBooleanValue(option, request.thinkingEnabled)
      : undefined;
    if (!option || value === undefined) {
      unsupported.push(
        `thinking ${request.thinkingEnabled ? "enabled" : "disabled"}`,
      );
    } else {
      updates.push({ configId: option.id, value });
    }
  }

  if (request.use1mContext !== undefined) {
    const option = findContextOption(configOptions);
    const value = option
      ? selectContextValue(option, request.use1mContext)
      : undefined;
    if (!option || value === undefined) {
      unsupported.push(
        request.use1mContext ? "1M context enabled" : "1M context disabled",
      );
    } else {
      updates.push({ configId: option.id, value });
    }
  }

  return { updates, unsupported };
}

function findMode(
  modes: ReadonlyArray<CursorAdvertisedMode>,
  candidates: ReadonlyArray<string>,
): CursorAdvertisedMode | undefined {
  return modes.find((mode) => {
    const identity = normalizedToken(`${mode.id} ${mode.name}`);
    return candidates.some((candidate) => identity.includes(candidate));
  });
}

export function cursorModeIdForEva(
  mode: EvaSessionMode | undefined,
  modes: ReadonlyArray<CursorAdvertisedMode>,
): { modeId?: string; error?: string } {
  if (mode === undefined) return {};
  if (mode === "ask") {
    const match = findMode(modes, ["ask"]);
    return match
      ? { modeId: match.id }
      : { error: "Cursor ACP does not advertise Ask mode." };
  }
  if (mode === "plan") {
    const match = findMode(modes, ["plan"]);
    return match
      ? { modeId: match.id }
      : { error: "Cursor ACP does not advertise Plan mode." };
  }
  if (modes.length === 0) return {};
  const match = findMode(modes, ["agent", "edit", "execute", "code"]);
  return match
    ? { modeId: match.id }
    : {
        error: `Cursor ACP does not advertise an Agent-compatible mode for ${mode}.`,
      };
}
