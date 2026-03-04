export function buildRootDirectoryInstruction(rootDirectory: string): string {
  if (!rootDirectory) return "";
  return `\nIMPORTANT: Unless the user mentions otherwise, all changes must be made inside the app at "${rootDirectory}".`;
}

export function getResponseLengthInstruction(responseLength: string): string {
  if (responseLength === "concise")
    return "\n\n## Response Length\nKeep your response very concise and brief. Use short sentences, bullet points where possible, and avoid unnecessary detail.";
  if (responseLength === "detailed")
    return "\n\n## Response Length\nProvide a detailed and thorough response. Include examples, explanations, and supporting context where helpful.";
  return "";
}
