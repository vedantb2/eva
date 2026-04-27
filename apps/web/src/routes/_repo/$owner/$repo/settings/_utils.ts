/**
 * Parses newline-delimited commands from a textarea value into a clean array.
 * Trims each line and drops empty lines so the resulting array is ready to
 * persist or hand to a Dockerfile/shell runner.
 */
export function parseCommandLines(text: string): string[] {
  return text
    .split("\n")
    .map((cmd) => cmd.trim())
    .filter((cmd) => cmd.length > 0);
}
