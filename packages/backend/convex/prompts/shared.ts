import { PERSONALISATION_PRESETS } from "../validators";

/** Builds the custom instructions block from a user's role preset and custom instructions. */
export function buildCustomInstructionsBlock(
  role: "business" | "dev" | "designer" | undefined,
  customInstructions: string | undefined,
): string {
  const parts: string[] = [];

  if (role && role in PERSONALISATION_PRESETS) {
    parts.push(PERSONALISATION_PRESETS[role].prompt);
  }
  if (customInstructions) {
    parts.push(customInstructions);
  }

  if (parts.length === 0) return "";
  return `\n\n## Custom Instructions\n${parts.join("\n\n")}`;
}

/** Builds the per-app system prompt block, appended to every quick task and session run for that app. */
export function buildSystemPromptBlock(
  systemPrompt: string | undefined,
): string {
  if (!systemPrompt || !systemPrompt.trim()) return "";
  return `\n\n## System Prompt\n${systemPrompt}`;
}

/** Builds an instruction string directing the agent to work inside a specific root directory. */
export function buildRootDirectoryInstruction(rootDirectory: string): string {
  if (!rootDirectory) return "";
  return `\nIMPORTANT: Unless the user mentions otherwise, all changes must be made inside the app at "${rootDirectory}".`;
}
