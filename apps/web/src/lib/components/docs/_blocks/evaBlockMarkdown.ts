export function evaBlockToMarkdown(
  blockType: string,
  data: Record<string, unknown>,
): string {
  return (
    "```eva:" + blockType + "\n" + JSON.stringify(data, null, 2) + "\n```\n\n"
  );
}
