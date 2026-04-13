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

/** Builds an instruction string directing the agent to work inside a specific root directory. */
export function buildRootDirectoryInstruction(rootDirectory: string): string {
  if (!rootDirectory) return "";
  return `\nIMPORTANT: Unless the user mentions otherwise, all changes must be made inside the app at "${rootDirectory}".`;
}

type PromptMode = "edit" | "plan";

/** Returns the response length instruction string based on mode and verbosity preference. */
export function getResponseLengthInstruction(
  responseLength: string,
  mode: PromptMode,
): string {
  if (mode === "plan") return "";

  if (responseLength === "detailed")
    return "\n\nResponse length: Summarise what you did with context on why and the business impact.";
  return "\n\nResponse length: Brief summary of what you did and the outcome.";
}
