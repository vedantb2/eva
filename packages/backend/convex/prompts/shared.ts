export function buildRootDirectoryInstruction(rootDirectory: string): string {
  if (!rootDirectory) return "";
  return `\nIMPORTANT: Unless the user mentions otherwise, all changes must be made inside the app at "${rootDirectory}".`;
}

type PromptMode = "ask" | "plan" | "execute";

export function getResponseLengthInstruction(
  responseLength: string,
  mode: PromptMode,
): string {
  if (mode === "plan") return "";

  if (mode === "ask") {
    if (responseLength === "detailed")
      return "\n\nResponse length: Thorough with examples. Use mermaid diagrams to visualise architecture and flow. Use markdown (headers, bullets, tables).";
    return "\n\nResponse length: Concise — cover key points without fluff. Use diagrams only if they clarify.";
  }

  if (responseLength === "detailed")
    return "\n\nResponse length: Summarise what you did with context on why and the business impact.";
  return "\n\nResponse length: Brief summary of what you did and the outcome.";
}
