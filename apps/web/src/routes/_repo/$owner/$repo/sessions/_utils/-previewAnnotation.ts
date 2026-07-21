export type PreviewDevice = "desktop" | "tablet" | "mobile";

export const PREVIEW_DEVICE_WIDTHS: Record<
  Exclude<PreviewDevice, "desktop">,
  number
> = {
  mobile: 390,
  tablet: 768,
};

export interface PreviewAnnotationContext {
  tagName: string;
  id: string;
  classNames: string[];
  selector: string;
  textContent: string;
  outerHTML: string;
  attributes: Record<string, string>;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
    display: string;
    position: string;
    margin: string;
    padding: string;
    borderRadius: string;
  };
  reactComponents: string[];
  pageUrl: string;
  pagePath: string;
  capturedAt: number;
}

export type PreviewAnnotationInbound =
  | { type: "ready" }
  | {
      type: "selected";
      context: PreviewAnnotationContext;
      rect: { top: number; left: number; width: number; height: number };
    }
  | {
      type: "rect";
      rect: { top: number; left: number; width: number; height: number } | null;
    }
  | { type: "dismissed" };

function parseRect(value: object): {
  top: number;
  left: number;
  width: number;
  height: number;
} | null {
  if (
    !("top" in value) ||
    !("left" in value) ||
    !("width" in value) ||
    !("height" in value) ||
    typeof value.top !== "number" ||
    typeof value.left !== "number" ||
    typeof value.width !== "number" ||
    typeof value.height !== "number"
  ) {
    return null;
  }
  return {
    top: value.top,
    left: value.left,
    width: value.width,
    height: value.height,
  };
}

function parseStringList(value: object | null | undefined): string[] {
  if (!value || !Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") out.push(item);
  }
  return out;
}

function parseAttributes(
  value: object | null | undefined,
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const key of Object.keys(value)) {
    if (key in value && typeof Reflect.get(value, key) === "string") {
      const entry = Reflect.get(value, key);
      if (typeof entry === "string") out[key] = entry;
    }
  }
  return out;
}

function parseStyleString(styles: object, key: string): string {
  if (!(key in styles)) return "";
  const value = Reflect.get(styles, key);
  return typeof value === "string" ? value : "";
}

function parseContext(value: object): PreviewAnnotationContext | null {
  if (
    !("tagName" in value) ||
    !("selector" in value) ||
    !("pageUrl" in value) ||
    !("pagePath" in value) ||
    !("outerHTML" in value) ||
    !("textContent" in value) ||
    !("id" in value) ||
    !("capturedAt" in value) ||
    !("boundingRect" in value) ||
    !("computedStyles" in value) ||
    typeof value.tagName !== "string" ||
    typeof value.selector !== "string" ||
    typeof value.pageUrl !== "string" ||
    typeof value.pagePath !== "string" ||
    typeof value.outerHTML !== "string" ||
    typeof value.textContent !== "string" ||
    typeof value.id !== "string" ||
    typeof value.capturedAt !== "number" ||
    typeof value.boundingRect !== "object" ||
    value.boundingRect === null ||
    typeof value.computedStyles !== "object" ||
    value.computedStyles === null
  ) {
    return null;
  }
  const boundingRect = parseRect(value.boundingRect);
  if (!boundingRect) return null;
  const styles = value.computedStyles;
  const classNames =
    "classNames" in value && Array.isArray(value.classNames)
      ? parseStringList(value.classNames)
      : [];
  const reactComponents =
    "reactComponents" in value && Array.isArray(value.reactComponents)
      ? parseStringList(value.reactComponents)
      : [];
  const attributes =
    "attributes" in value &&
    typeof value.attributes === "object" &&
    value.attributes !== null
      ? parseAttributes(value.attributes)
      : {};

  return {
    tagName: value.tagName,
    id: value.id,
    classNames,
    selector: value.selector,
    textContent: value.textContent,
    outerHTML: value.outerHTML,
    attributes,
    boundingRect,
    computedStyles: {
      color: parseStyleString(styles, "color"),
      backgroundColor: parseStyleString(styles, "backgroundColor"),
      fontSize: parseStyleString(styles, "fontSize"),
      fontWeight: parseStyleString(styles, "fontWeight"),
      fontFamily: parseStyleString(styles, "fontFamily"),
      display: parseStyleString(styles, "display"),
      position: parseStyleString(styles, "position"),
      margin: parseStyleString(styles, "margin"),
      padding: parseStyleString(styles, "padding"),
      borderRadius: parseStyleString(styles, "borderRadius"),
    },
    reactComponents,
    pageUrl: value.pageUrl,
    pagePath: value.pagePath,
    capturedAt: value.capturedAt,
  };
}

/**
 * Narrows iframe postMessage payloads for the annotation bridge.
 * Follows PreviewNavBar's field-by-field structural checks.
 */
export function parseAnnotationInbound(
  data: object | null,
): PreviewAnnotationInbound | null {
  if (!data || !("type" in data) || typeof data.type !== "string") {
    return null;
  }
  if (data.type === "eva-preview-annotate-ready") {
    return { type: "ready" };
  }
  if (data.type === "eva-preview-annotate-dismissed") {
    return { type: "dismissed" };
  }
  if (data.type === "eva-preview-annotate-rect") {
    if (!("rect" in data)) return null;
    if (data.rect === null) {
      return { type: "rect", rect: null };
    }
    if (typeof data.rect !== "object" || data.rect === null) return null;
    return { type: "rect", rect: parseRect(data.rect) };
  }
  if (data.type === "eva-preview-annotate-selected") {
    if (
      !("context" in data) ||
      !("rect" in data) ||
      typeof data.context !== "object" ||
      data.context === null ||
      typeof data.rect !== "object" ||
      data.rect === null
    ) {
      return null;
    }
    const context = parseContext(data.context);
    const rect = parseRect(data.rect);
    if (!context || !rect) return null;
    return { type: "selected", context, rect };
  }
  return null;
}

function elementChip(ctx: PreviewAnnotationContext): string {
  const cls = ctx.classNames[0] ? `.${ctx.classNames[0]}` : "";
  return `<${ctx.tagName}${cls}>`;
}

/** Compact chat-display line for an annotation submission. */
export function buildAnnotationDisplay(
  feedback: string,
  ctx: PreviewAnnotationContext,
): string {
  return `${feedback.trim()}\n\n[Annotated ${elementChip(ctx)} on ${ctx.pagePath}]`;
}

/** Rich agent prompt with element context for the session workflow. */
export function buildAnnotationPrompt(
  feedback: string,
  ctx: PreviewAnnotationContext,
): string {
  let description = `${feedback.trim()}\n\n---\n**Preview annotation**\n`;
  description += `- Page: \`${ctx.pagePath}\`\n`;
  description += `- Element: \`${elementChip(ctx)}\`\n`;
  description += `- Selector: \`${ctx.selector}\`\n`;
  if (ctx.id) {
    description += `- ID: \`${ctx.id}\`\n`;
  }
  if (ctx.classNames.length > 0) {
    description += `- Classes: \`${ctx.classNames.join(", ")}\`\n`;
  }
  if (ctx.reactComponents.length > 0) {
    description += `- React: \`${ctx.reactComponents.join(" → ")}\`\n`;
  }
  if (ctx.textContent) {
    description += `- Text: ${ctx.textContent}\n`;
  }
  description += `- Styles: color=${ctx.computedStyles.color}; background=${ctx.computedStyles.backgroundColor}; font=${ctx.computedStyles.fontSize}/${ctx.computedStyles.fontWeight} ${ctx.computedStyles.fontFamily}; display=${ctx.computedStyles.display}; position=${ctx.computedStyles.position}\n`;
  description += `\n\`\`\`html\n${ctx.outerHTML}\n\`\`\``;
  return description;
}
