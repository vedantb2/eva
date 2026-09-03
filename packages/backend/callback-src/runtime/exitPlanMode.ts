import { writeFileSync } from "fs";
import { join } from "path";
import { ENTITY_ID, ENTITY_ID_FIELD, WORK_DIR } from "../config.js";
import { callConvexWithRetry } from "../http/convexClient.js";
import { log } from "../utils.js";

const EXIT_PLAN_DENY_MESSAGE =
  "The client captured your proposed plan. Stop here and wait for the user's feedback or implementation request in a later turn.";

const capturedKeys = new Set<string>();

export function extractExitPlanModePlan(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as { plan?: unknown };
  return typeof record.plan === "string" && record.plan.trim().length > 0
    ? record.plan.trim()
    : undefined;
}

export function exitPlanCaptureKey(input: {
  toolUseId?: string;
  planMarkdown: string;
}): string {
  return input.toolUseId && input.toolUseId.length > 0
    ? `tool:${input.toolUseId}`
    : `plan:${input.planMarkdown}`;
}

function persistPlanMarkdown(planMarkdown: string): void {
  try {
    writeFileSync(join(WORK_DIR, "plan.md"), `${planMarkdown.trimEnd()}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("exitPlanMode: could not write plan.md — " + message);
  }
}

/** Posts the plan to Convex and writes plan.md. Deduped per process. */
export async function captureProposedPlan(input: {
  planMarkdown: string;
  toolUseId?: string;
}): Promise<void> {
  const planMarkdown = input.planMarkdown.trim();
  if (!planMarkdown || !ENTITY_ID || ENTITY_ID_FIELD !== "sessionId") {
    return;
  }
  const key = exitPlanCaptureKey({
    toolUseId: input.toolUseId,
    planMarkdown,
  });
  if (capturedKeys.has(key)) return;
  capturedKeys.add(key);
  persistPlanMarkdown(planMarkdown);
  try {
    await callConvexWithRetry("mutation", "proposedPlans:capture", {
      entityId: ENTITY_ID,
      planMarkdown,
      ...(input.toolUseId ? { toolUseId: input.toolUseId } : {}),
    });
    log("exitPlanMode: captured proposed plan (" + key + ")");
  } catch (error) {
    capturedKeys.delete(key);
    const message = error instanceof Error ? error.message : String(error);
    log("exitPlanMode: capture failed — " + message);
  }
}

export function exitPlanModeDenyResult(): {
  behavior: "deny";
  message: string;
} {
  return { behavior: "deny", message: EXIT_PLAN_DENY_MESSAGE };
}

/** Walks an assistant SDK message for ExitPlanMode tool_use blocks. */
export function extractExitPlanModeFromAssistant(
  message: unknown,
): Array<{ planMarkdown: string; toolUseId?: string }> {
  if (!message || typeof message !== "object") return [];
  const record = message as {
    type?: unknown;
    message?: { content?: unknown };
  };
  if (record.type !== "assistant") return [];
  const content = record.message?.content;
  if (!Array.isArray(content)) return [];
  const found: Array<{ planMarkdown: string; toolUseId?: string }> = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const toolUse = block as {
      type?: unknown;
      name?: unknown;
      id?: unknown;
      input?: unknown;
    };
    if (toolUse.type !== "tool_use" || toolUse.name !== "ExitPlanMode") {
      continue;
    }
    const planMarkdown = extractExitPlanModePlan(toolUse.input);
    if (!planMarkdown) continue;
    found.push({
      planMarkdown,
      toolUseId: typeof toolUse.id === "string" ? toolUse.id : undefined,
    });
  }
  return found;
}

export async function maybeCaptureExitPlanModeTool(
  toolName: string,
  input: unknown,
  toolUseId?: string,
): Promise<boolean> {
  if (toolName !== "ExitPlanMode") return false;
  const planMarkdown = extractExitPlanModePlan(input);
  if (planMarkdown) {
    await captureProposedPlan({ planMarkdown, toolUseId });
  }
  return true;
}
