/** Assembles a pull request body from an array of heading/content sections. */
export function buildPrBody(
  sections: Array<{ heading: string; content: string }>,
): string {
  const parts: string[] = [];
  for (const section of sections) {
    parts.push(`## ${section.heading}`);
    parts.push(section.content);
    parts.push("");
  }
  parts.push("---");
  parts.push("*Created by Eva AI Agent*");
  return parts.join("\n");
}
