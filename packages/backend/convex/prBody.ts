/** Assembles a pull request body from an array of heading/content sections. */
export function buildPrBody(
  sections: Array<{ heading: string; content: string }>,
  evaUrl?: string,
): string {
  const parts: string[] = [];
  for (const section of sections) {
    parts.push(`## ${section.heading}`);
    parts.push(section.content);
    parts.push("");
  }
  parts.push("---");
  if (evaUrl) {
    parts.push(`[View in Eva](${evaUrl}) | *Created by Eva*`);
  } else {
    parts.push("*Created by Eva*");
  }
  return parts.join("\n");
}
