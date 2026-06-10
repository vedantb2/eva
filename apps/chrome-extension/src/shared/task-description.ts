import type { StoredPin } from "./messaging";
import type { ExtractedContext } from "./types";

/** Bulk pin description (used by Run All / Add to Project). */
export function buildPinDescription(pin: StoredPin, pageUrl: string): string {
  let desc = `${pin.text}\n\n**Page:** ${pageUrl}`;
  if (pin.selector) desc += `\n**Selector:** \`${pin.selector}\``;
  if (pin.selectedText) desc += `\n**Selected text:** ${pin.selectedText}`;
  return desc;
}

/** Rich single-pin description with element context. */
export function buildContextDescription(
  title: string,
  pageUrl: string,
  ctx?: ExtractedContext,
): string {
  let description = `${title}\n\n**Page:** ${pageUrl}`;
  if (!ctx) return description;

  description += `\n\n---\n**Captured Element Context**\n`;
  description += `- Element: \`<${ctx.element.tagName}>\`\n`;
  description += `- Selector: \`${ctx.element.selector}\`\n`;
  if (ctx.element.id) {
    description += `- ID: \`${ctx.element.id}\`\n`;
  }
  if (ctx.element.classNames.length > 0) {
    description += `- Classes: \`${ctx.element.classNames.join(", ")}\`\n`;
  }
  if (ctx.metadata.hasReact && ctx.react) {
    description += `\n**React Context**\n`;
    description += `- Component: \`${ctx.react.name || "Unknown"}\`\n`;
    description += `- Total components: ${ctx.metadata.totalComponents}\n`;
    description += `- React version: ${ctx.metadata.reactVersion}\n\n`;
    description += `<details>\n<summary>Full Component Tree</summary>\n\n\`\`\`json\n${JSON.stringify(ctx.react, null, 2)}\n\`\`\`\n</details>`;
  } else {
    description += `\n<details>\n<summary>Element Details</summary>\n\n\`\`\`html\n${ctx.element.outerHTML}\n\`\`\`\n</details>`;
  }
  return description;
}
