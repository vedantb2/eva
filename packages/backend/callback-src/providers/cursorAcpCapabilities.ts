import type {
  ClientContext,
  SessionConfigOption,
  SessionModeState,
} from "@agentclientprotocol/sdk";
import { z } from "zod";
import { PROVIDER_ACCOUNT_ID, REPO_ID } from "../config.js";
import { callConvexWithRetry } from "../http/convexClient.js";
import type { JsonValue } from "../types.js";
import { log } from "../utils.js";
import type {
  CursorAdvertisedMode,
  CursorAdvertisedModel,
  CursorCapabilityConfigOption,
  CursorCapabilitySelectValue,
} from "../../cursorCapabilities.js";

const MAX_MODELS = 100;
const MAX_CONFIG_OPTIONS = 40;
const MAX_SELECT_VALUES = 100;
const MAX_TEXT_LENGTH = 500;

const selectValueSchema = z.object({
  value: z.string(),
  name: z.string(),
  description: z.string().nullish(),
});
const selectGroupSchema = z.object({
  group: z.string(),
  name: z.string(),
  options: z.array(selectValueSchema),
});
const configOptionSchema = z.union([
  z.object({
    type: z.literal("select"),
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    category: z.string().nullish(),
    currentValue: z.string(),
    options: z.union([z.array(selectValueSchema), z.array(selectGroupSchema)]),
  }),
  z.object({
    type: z.literal("boolean"),
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    category: z.string().nullish(),
    currentValue: z.boolean(),
  }),
]);
const availableModelsResponseSchema = z.object({
  models: z.array(
    z.object({
      value: z.string(),
      name: z.string(),
      configOptions: z.array(configOptionSchema).optional(),
    }),
  ),
});

function boundedText(value: string): string {
  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function optionalText(value: string | null | undefined): string | undefined {
  const bounded = value ? boundedText(value) : "";
  return bounded.length > 0 ? bounded : undefined;
}

function sanitizeSelectValue(input: {
  value: string;
  name: string;
  description?: string | null;
}): CursorCapabilitySelectValue | null {
  const value = boundedText(input.value);
  const name = boundedText(input.name);
  if (!value || !name) return null;
  return {
    value,
    name,
    ...(optionalText(input.description)
      ? { description: optionalText(input.description) }
      : {}),
  };
}

function flattenSelectValues(
  options: SessionConfigOption & { type: "select" },
): CursorCapabilitySelectValue[] {
  const values: CursorCapabilitySelectValue[] = [];
  for (const entry of options.options) {
    if (values.length >= MAX_SELECT_VALUES) break;
    if ("value" in entry) {
      const value = sanitizeSelectValue(entry);
      if (value) values.push(value);
      continue;
    }
    for (const nested of entry.options) {
      if (values.length >= MAX_SELECT_VALUES) break;
      const value = sanitizeSelectValue(nested);
      if (value) values.push(value);
    }
  }
  return values;
}

export function sanitizeCursorConfigOptions(
  options: ReadonlyArray<SessionConfigOption> | null | undefined,
): CursorCapabilityConfigOption[] {
  const sanitized: CursorCapabilityConfigOption[] = [];
  for (const option of options ?? []) {
    if (sanitized.length >= MAX_CONFIG_OPTIONS) break;
    const id = boundedText(option.id);
    const name = boundedText(option.name);
    if (!id || !name) continue;
    const common = {
      id,
      name,
      ...(optionalText(option.description)
        ? { description: optionalText(option.description) }
        : {}),
      ...(optionalText(option.category)
        ? { category: optionalText(option.category) }
        : {}),
    };
    if (option.type === "boolean") {
      sanitized.push({
        type: "boolean",
        ...common,
        currentValue: option.currentValue,
      });
      continue;
    }
    sanitized.push({
      type: "select",
      ...common,
      currentValue: boundedText(option.currentValue),
      options: flattenSelectValues(option),
    });
  }
  return sanitized;
}

function sanitizeParsedConfigOptions(
  options: ReadonlyArray<z.infer<typeof configOptionSchema>> | undefined,
): CursorCapabilityConfigOption[] {
  const sdkCompatible: SessionConfigOption[] = [];
  for (const option of options ?? []) {
    sdkCompatible.push(option);
  }
  return sanitizeCursorConfigOptions(sdkCompatible);
}

export async function discoverCursorModels(
  context: ClientContext,
): Promise<CursorAdvertisedModel[] | null> {
  try {
    const raw = await context.request<JsonValue, Record<string, never>>(
      "cursor/list_available_models",
      {},
    );
    const parsed = availableModelsResponseSchema.safeParse(raw);
    if (!parsed.success) {
      log("cursor_acp capability discovery returned an invalid payload");
      return null;
    }
    const models: CursorAdvertisedModel[] = [];
    for (const model of parsed.data.models) {
      if (models.length >= MAX_MODELS) break;
      const value = boundedText(model.value);
      const name = boundedText(model.name);
      if (!value || !name) continue;
      models.push({
        value,
        name,
        configOptions: sanitizeParsedConfigOptions(model.configOptions),
      });
    }
    return models;
  } catch (error) {
    log(
      `cursor_acp capability discovery unavailable: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

function fallbackModelsFromSessionOptions(
  configOptions: ReadonlyArray<SessionConfigOption> | null | undefined,
): CursorAdvertisedModel[] {
  const modelOption = (configOptions ?? []).find(
    (option) =>
      option.type === "select" &&
      (option.category === "model" ||
        option.id.toLowerCase().includes("model")),
  );
  if (modelOption?.type !== "select") return [];
  return flattenSelectValues(modelOption)
    .slice(0, MAX_MODELS)
    .map((model) => ({
      value: model.value,
      name: model.name,
      configOptions: sanitizeCursorConfigOptions(configOptions),
    }));
}

function sanitizeModes(
  modes: SessionModeState | null | undefined,
): CursorAdvertisedMode[] {
  return (modes?.availableModes ?? []).flatMap((mode) => {
    const id = boundedText(mode.id);
    const name = boundedText(mode.name);
    if (!id || !name) return [];
    return [
      {
        id,
        name,
        ...(optionalText(mode.description)
          ? { description: optionalText(mode.description) }
          : {}),
      },
    ];
  });
}

function configOptionJson(option: CursorCapabilityConfigOption): JsonValue {
  const common = {
    type: option.type,
    id: option.id,
    name: option.name,
    ...(option.description ? { description: option.description } : {}),
    ...(option.category ? { category: option.category } : {}),
  };
  return option.type === "boolean"
    ? { ...common, currentValue: option.currentValue }
    : {
        ...common,
        currentValue: option.currentValue,
        options: option.options.map((value) => ({
          value: value.value,
          name: value.name,
          ...(value.description ? { description: value.description } : {}),
        })),
      };
}

function modelJson(model: CursorAdvertisedModel): JsonValue {
  return {
    value: model.value,
    name: model.name,
    configOptions: model.configOptions.map(configOptionJson),
  };
}

function modeJson(mode: CursorAdvertisedMode): JsonValue {
  return {
    id: mode.id,
    name: mode.name,
    ...(mode.description ? { description: mode.description } : {}),
  };
}

/** Best-effort reporting; capability persistence must never fail a prompt. */
export async function reportCursorCapabilities(input: {
  cliVersion: string | null | undefined;
  discoveredModels: CursorAdvertisedModel[] | null;
  configOptions: ReadonlyArray<SessionConfigOption> | null | undefined;
  modes: SessionModeState | null | undefined;
}): Promise<void> {
  if (!REPO_ID) return;
  const models =
    input.discoveredModels && input.discoveredModels.length > 0
      ? input.discoveredModels
      : fallbackModelsFromSessionOptions(input.configOptions);
  const sessionConfigOptions = sanitizeCursorConfigOptions(input.configOptions);
  const availableModes = sanitizeModes(input.modes);
  try {
    await callConvexWithRetry("mutation", "providerCapabilities:recordCursor", {
      repoId: REPO_ID,
      ...(PROVIDER_ACCOUNT_ID
        ? { providerAccountId: PROVIDER_ACCOUNT_ID }
        : {}),
      cliVersion: boundedText(input.cliVersion ?? "unreported") || "unreported",
      models: models.map(modelJson),
      sessionConfigOptions: sessionConfigOptions.map(configOptionJson),
      availableModes: availableModes.map(modeJson),
    });
  } catch (error) {
    log(
      `cursor_acp capability report failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
