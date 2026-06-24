import type { ExtractedContext } from "@/shared/types";

/**
 * Formats a captured element as a markdown block ready to paste into a task,
 * chat, or PR comment. Mirrors the "inspect element" feedback the side panel
 * used to show, condensed to the essentials.
 */
export function formatInspectMarkdown(ctx: ExtractedContext): string {
  const { element, react, metadata } = ctx;
  const lines: string[] = ["## Element inspection", ""];

  lines.push(`**Page:** ${metadata.sourceUrl}`);
  lines.push(`**Selector:** \`${element.selector}\``);

  const idPart = element.id ? `#${element.id}` : "";
  const classPart =
    element.classNames.length > 0 ? `.${element.classNames.join(".")}` : "";
  const suffix = `${idPart}${classPart}`;
  lines.push(
    `**Element:** \`<${element.tagName}>\`${suffix ? ` ${suffix}` : ""}`,
  );

  if (metadata.hasReact && react) {
    lines.push(
      `**React:** \`${react.name || "Unknown"}\` — ${metadata.totalComponents} components, React ${metadata.reactVersion}`,
    );
    const propNames = Object.keys(react.props ?? {});
    const hookTypes = (react.hooks ?? []).map((h) => h.type);
    const parts = [
      propNames.length > 0 ? `props: ${propNames.join(", ")}` : "",
      hookTypes.length > 0 ? `hooks: ${hookTypes.join(", ")}` : "",
    ].filter(Boolean);
    if (parts.length > 0) lines.push(`**Props/hooks:** ${parts.join(" · ")}`);
  }

  if (ctx.selectedText) {
    lines.push(`**Selected text:** "${ctx.selectedText}"`);
  }

  lines.push("", "```html", element.outerHTML, "```");
  return lines.join("\n");
}

/**
 * Copies text to the clipboard. Prefers the async clipboard API (available in
 * content scripts during a user gesture) and falls back to a hidden textarea.
 * Returns whether the copy succeeded so the caller can surface feedback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}
