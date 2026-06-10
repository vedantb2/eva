import type { ExtractedContext } from "@/shared/types";

export function formatInspectMarkdown(ctx: ExtractedContext): string {
  const lines: string[] = [];

  lines.push(`**Page:** ${ctx.metadata.sourceUrl}`);
  lines.push(`**Selector:** \`${ctx.element.selector}\``);
  lines.push(
    `**Element:** \`<${ctx.element.tagName}>\` (${Math.round(ctx.element.boundingRect.width)}×${Math.round(ctx.element.boundingRect.height)})`,
  );

  if (ctx.element.id) {
    lines.push(`**ID:** \`${ctx.element.id}\``);
  }
  if (ctx.element.classNames.length > 0) {
    lines.push(`**Classes:** \`${ctx.element.classNames.join(", ")}\``);
  }

  if (ctx.selectedText) {
    lines.push("");
    lines.push(`**Selected text:** ${ctx.selectedText}`);
  }

  if (ctx.metadata.hasReact && ctx.react) {
    lines.push("");
    lines.push(`**React component:** \`${ctx.react.name || "Unknown"}\``);
    lines.push(`**React version:** ${ctx.metadata.reactVersion}`);
    lines.push(`**Total components:** ${ctx.metadata.totalComponents}`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(ctx.react, null, 2));
    lines.push("```");
  } else {
    lines.push("");
    lines.push("```html");
    lines.push(ctx.element.outerHTML);
    lines.push("```");
  }

  return lines.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for pages where the Clipboard API is blocked
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}
